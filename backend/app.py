import subprocess
import os
import secrets
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import requests
import docker
import threading
import time

app = Flask(__name__)
CORS(app)

TF_DIR = "/app/easy-tier"
TF_DIR_MEDIUM = "/app/medium-tier"
TF_DIR_HARD = "/app/hard-tier"

current_session = {"flag": None, "bucket": None}

medium_launch_in_progress = False
medium_session = {"flag": None, "env_suffix": None, "role_arn": None, "leak_bucket": None}

hard_launch_in_progress = False
hard_session = {"flag": None, "env_suffix": None, "role_arn": None, "role_name": None, "credentials": {}}

def run_terraform(args, extra_vars=None):
    env = os.environ.copy()
    env["TF_VAR_ls_endpoint"] = "http://localstack:4566"
    if extra_vars:
        for key, value in extra_vars.items():
            env[f"TF_VAR_{key}"] = value

    lock_safe_args = args + ["-lock=false"] if args[0] in ("apply", "destroy") else args

    return subprocess.run(
        ["terraform"] + lock_safe_args,
        cwd=TF_DIR,
        env=env,
        capture_output=True,
        text=True
    )

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/api/launch", methods=["POST"])
def launch():
    suffix = secrets.token_hex(4)
    flag = f"EE{{public_bucket_easy_{secrets.token_hex(6)}}}"

    init_result = run_terraform(["init", "-input=false"])
    if init_result.returncode != 0:
        return jsonify({"status": "error", "stage": "init", "detail": init_result.stderr}), 500

    apply_result = run_terraform(
        ["apply", "-auto-approve", "-input=false"],
        extra_vars={"bucket_suffix": suffix, "flag_value": flag}
    )
    if apply_result.returncode != 0:
        return jsonify({"status": "error", "stage": "apply", "detail": apply_result.stderr}), 500

    current_session["flag"] = flag
    current_session["bucket"] = f"corptech-dev-assets-{suffix}"

    return jsonify({"status": "success", "bucket": current_session["bucket"]})

@app.route("/api/destroy", methods=["POST"])
def destroy():
    if not current_session["bucket"]:
        return jsonify({"status": "error", "detail": "nothing is currently launched"}), 400

    suffix = current_session["bucket"].replace("corptech-dev-assets-", "")
    result = run_terraform(
        ["destroy", "-auto-approve", "-input=false"],
        extra_vars={"bucket_suffix": suffix, "flag_value": current_session["flag"]}
    )
    if result.returncode != 0:
        return jsonify({"status": "error", "detail": result.stderr}), 500

    current_session["flag"] = None
    current_session["bucket"] = None
    return jsonify({"status": "destroyed"})

@app.route("/api/submit", methods=["POST"])
def submit():
    data = request.get_json(force=True)
    flag = (data.get("flag") or "").strip()
    return jsonify({"correct": flag == current_session["flag"]})


def run_terraform_medium(args, extra_vars=None):
    env = os.environ.copy()
    env["TF_VAR_ls_endpoint"] = "http://localstack:4566"
    if extra_vars:
        for key, value in extra_vars.items():
            env[f"TF_VAR_{key}"] = value

    lock_safe_args = args + ["-lock=false"] if args[0] in ("apply", "destroy") else args

    return subprocess.run(
        ["terraform"] + lock_safe_args,
        cwd=TF_DIR_MEDIUM,
        env=env,
        capture_output=True,
        text=True
    )

@app.route("/api/medium/launch", methods=["POST"])
def medium_launch():
    global medium_launch_in_progress
    if medium_launch_in_progress:
        return jsonify({"status": "error", "detail": "a launch is already in progress, please wait"}), 429

    medium_launch_in_progress = True
    try:
        return _do_medium_launch()
    finally:
        medium_launch_in_progress = False

def _do_medium_launch():
    state_file = os.path.join(TF_DIR_MEDIUM, "terraform.tfstate")
    backup_file = os.path.join(TF_DIR_MEDIUM, "terraform.tfstate.backup")
    for f in (state_file, backup_file):
        if os.path.exists(f):
            os.remove(f)

    suffix = secrets.token_hex(4)
    flag = f"EE{{assumed_role_medium_{secrets.token_hex(6)}}}"

    init_result = run_terraform_medium(["init", "-input=false"])
    if init_result.returncode != 0:
        return jsonify({"status": "error", "stage": "init", "detail": init_result.stderr}), 500

    apply_result = run_terraform_medium(
        ["apply", "-auto-approve", "-input=false"],
        extra_vars={"env_suffix": suffix}
    )
    if apply_result.returncode != 0:
        return jsonify({"status": "error", "stage": "apply", "detail": apply_result.stderr}), 500

    output_result = run_terraform_medium(["output", "-raw", "data_admin_role_arn"])
    role_arn = output_result.stdout.strip()

    medium_session["flag"] = flag
    medium_session["env_suffix"] = suffix
    medium_session["role_arn"] = role_arn
    medium_session["leak_bucket"] = f"corptech-ops-notes-{suffix}"

    return jsonify({
        "status": "success",
        "leak_bucket": medium_session["leak_bucket"]
    })

@app.route("/api/medium/destroy", methods=["POST"])
def medium_destroy():
    if not medium_session["env_suffix"]:
        return jsonify({"status": "error", "detail": "nothing is currently launched"}), 400

    result = run_terraform_medium(
        ["destroy", "-auto-approve", "-input=false"],
        extra_vars={"env_suffix": medium_session["env_suffix"]}
    )
    if result.returncode != 0:
        return jsonify({"status": "error", "detail": result.stderr}), 500

    medium_session["flag"] = None
    medium_session["env_suffix"] = None
    medium_session["role_arn"] = None
    medium_session["leak_bucket"] = None
    return jsonify({"status": "destroyed"})

@app.route("/api/medium/verify", methods=["POST"])
def medium_verify():
    """
    Medium tier's player genuinely calls sts:assume-role themselves using
    leaked credentials, so the backend never sees that session ahead of
    time — there's nothing to directly compare against. Verification here
    relies on asking LocalStack to resolve the submitted credentials'
    identity. This is a known, accepted limitation: LocalStack's free
    tier does not do strict, cryptographic-grade credential validation
    the way real AWS does, so this check is best-effort, not airtight.
    Hard tier (see /api/hard/verify) avoids this by having the backend
    independently know the correct answer instead of trusting LocalStack.
    """
    if not medium_session["role_arn"]:
        return jsonify({"status": "error", "detail": "nothing is currently launched"}), 400

    data = request.get_json(force=True)
    access_key = (data.get("access_key_id") or "").strip()
    secret_key = (data.get("secret_access_key") or "").strip()
    session_token = (data.get("session_token") or "").strip()

    if not access_key or not secret_key or not session_token:
        return jsonify({"status": "error", "detail": "missing credentials"}), 400

    env = os.environ.copy()
    env["AWS_ACCESS_KEY_ID"] = access_key
    env["AWS_SECRET_ACCESS_KEY"] = secret_key
    env["AWS_SESSION_TOKEN"] = session_token
    env["AWS_DEFAULT_REGION"] = "us-east-1"

    result = subprocess.run(
        ["aws", "sts", "get-caller-identity", "--endpoint-url", "http://localstack:4566"],
        env=env,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        return jsonify({"correct": False, "detail": result.stderr or result.stdout})

    identity = json.loads(result.stdout)
    assumed_arn = identity.get("Arn", "")

    expected_role_name = medium_session["role_arn"].split("/")[-1]

    if f"assumed-role/{expected_role_name}/" in assumed_arn:
        return jsonify({"correct": True, "flag": medium_session["flag"]})
    else:
        return jsonify({"correct": False, "detail": "valid credentials, but not the expected role"})

@app.route("/api/medium/submit", methods=["POST"])
def medium_submit():
    data = request.get_json(force=True)
    flag = (data.get("flag") or "").strip()
    return jsonify({"correct": flag == medium_session["flag"]})


def run_terraform_hard(args, extra_vars=None):
    env = os.environ.copy()
    env["TF_VAR_ls_endpoint"] = "http://localstack:4566"
    if extra_vars:
        for key, value in extra_vars.items():
            env[f"TF_VAR_{key}"] = value

    lock_safe_args = args + ["-lock=false"] if args[0] in ("apply", "destroy") else args

    return subprocess.run(
        ["terraform"] + lock_safe_args,
        cwd=TF_DIR_HARD,
        env=env,
        capture_output=True,
        text=True
    )

@app.route("/api/hard/launch", methods=["POST"])
def hard_launch():
    global hard_launch_in_progress
    if hard_launch_in_progress:
        return jsonify({"status": "error", "detail": "a launch is already in progress, please wait"}), 429

    hard_launch_in_progress = True
    try:
        return _do_hard_launch()
    finally:
        hard_launch_in_progress = False

def _do_hard_launch():
    state_file = os.path.join(TF_DIR_HARD, "terraform.tfstate")
    backup_file = os.path.join(TF_DIR_HARD, "terraform.tfstate.backup")
    for f in (state_file, backup_file):
        if os.path.exists(f):
            os.remove(f)

    suffix = secrets.token_hex(4)
    flag = f"EE{{ssrf_metadata_hard_{secrets.token_hex(6)}}}"

    init_result = run_terraform_hard(["init", "-input=false"])
    if init_result.returncode != 0:
        return jsonify({"status": "error", "stage": "init", "detail": init_result.stderr}), 500

    apply_result = run_terraform_hard(
        ["apply", "-auto-approve", "-input=false"],
        extra_vars={"env_suffix": suffix}
    )
    if apply_result.returncode != 0:
        return jsonify({"status": "error", "stage": "apply", "detail": apply_result.stderr}), 500

    role_arn = run_terraform_hard(["output", "-raw", "role_arn"]).stdout.strip()
    role_name = run_terraform_hard(["output", "-raw", "role_name"]).stdout.strip()

    assume_env = os.environ.copy()
    assume_env["AWS_ACCESS_KEY_ID"] = "test"
    assume_env["AWS_SECRET_ACCESS_KEY"] = "test"
    assume_env["AWS_DEFAULT_REGION"] = "us-east-1"

    assume_result = subprocess.run(
        ["aws", "sts", "assume-role", "--role-arn", role_arn,
         "--role-session-name", "instance-session",
         "--endpoint-url", "http://localstack:4566"],
        env=assume_env,
        capture_output=True,
        text=True
    )
    if assume_result.returncode != 0:
        return jsonify({"status": "error", "stage": "assume-role", "detail": assume_result.stderr}), 500

    creds = json.loads(assume_result.stdout)["Credentials"]

    # The backend already knows these exact credentials are correct —
    # store them so /api/hard/verify can compare directly, rather than
    # asking LocalStack to re-validate something we already generated.
    hard_session["credentials"] = {
        "access_key": creds["AccessKeyId"],
        "secret_key": creds["SecretAccessKey"],
        "session_token": creds["SessionToken"]
    }

    push_result = requests.post("http://hard-metadata:9000/admin/set-credentials", json={
        "role_name": role_name,
        "access_key": creds["AccessKeyId"],
        "secret_key": creds["SecretAccessKey"],
        "session_token": creds["SessionToken"]
    })
    if push_result.status_code != 200:
        return jsonify({"status": "error", "detail": "failed to prime metadata service"}), 500

    hard_session["flag"] = flag
    hard_session["env_suffix"] = suffix
    hard_session["role_arn"] = role_arn
    hard_session["role_name"] = role_name

    return jsonify({"status": "success", "webapp_url": "http://localhost:5002"})

@app.route("/api/hard/destroy", methods=["POST"])
def hard_destroy():
    if not hard_session["env_suffix"]:
        return jsonify({"status": "error", "detail": "nothing is currently launched"}), 400

    result = run_terraform_hard(
        ["destroy", "-auto-approve", "-input=false"],
        extra_vars={"env_suffix": hard_session["env_suffix"]}
    )
    if result.returncode != 0:
        return jsonify({"status": "error", "detail": result.stderr}), 500

    requests.post("http://hard-metadata:9000/admin/set-credentials", json={
        "role_name": None, "access_key": None, "secret_key": None, "session_token": None
    })

    hard_session["flag"] = None
    hard_session["env_suffix"] = None
    hard_session["role_arn"] = None
    hard_session["role_name"] = None
    hard_session["credentials"] = {}
    return jsonify({"status": "destroyed"})

@app.route("/api/hard/verify", methods=["POST"])
def hard_verify():
    """
    Unlike Medium tier, the backend already generated these exact
    credentials itself during launch and planted them in the fake
    metadata service. So we don't need to ask LocalStack to re-validate
    anything — LocalStack's community-tier credential checking isn't
    strict enough to trust for this. We just directly compare what was
    submitted against what we know is correct.
    """
    if not hard_session["role_arn"]:
        return jsonify({"status": "error", "detail": "nothing is currently launched"}), 400

    data = request.get_json(force=True)
    access_key = (data.get("access_key_id") or "").strip()
    secret_key = (data.get("secret_access_key") or "").strip()
    session_token = (data.get("session_token") or "").strip()

    expected = hard_session.get("credentials", {})

    if (access_key == expected.get("access_key") and
        secret_key == expected.get("secret_key") and
        session_token == expected.get("session_token")):
        return jsonify({"correct": True, "flag": hard_session["flag"]})

    return jsonify({"correct": False, "detail": "those credentials don't match what was issued for this session"})

@app.route("/api/hard/submit", methods=["POST"])
def hard_submit():
    data = request.get_json(force=True)
    flag = (data.get("flag") or "").strip()
    return jsonify({"correct": flag == hard_session["flag"]})


@app.route("/api/exit", methods=["POST"])
def exit_all():
    details = []

    if current_session["bucket"]:
        suffix = current_session["bucket"].replace("corptech-dev-assets-", "")
        run_terraform(["destroy", "-auto-approve", "-input=false"],
                       extra_vars={"bucket_suffix": suffix, "flag_value": current_session["flag"]})
        current_session["flag"] = None
        current_session["bucket"] = None
        details.append("easy tier destroyed")

    if medium_session["env_suffix"]:
        run_terraform_medium(["destroy", "-auto-approve", "-input=false"],
                              extra_vars={"env_suffix": medium_session["env_suffix"]})
        medium_session["flag"] = None
        medium_session["env_suffix"] = None
        medium_session["role_arn"] = None
        medium_session["leak_bucket"] = None
        details.append("medium tier destroyed")

    if hard_session["env_suffix"]:
        run_terraform_hard(["destroy", "-auto-approve", "-input=false"],
                            extra_vars={"env_suffix": hard_session["env_suffix"]})
        hard_session["flag"] = None
        hard_session["env_suffix"] = None
        hard_session["role_arn"] = None
        hard_session["role_name"] = None
        hard_session["credentials"] = {}
        details.append("hard tier destroyed")

    client = docker.from_env()
    other_containers = ["ee-frontend", "localstack", "ee-hard-webapp", "ee-hard-metadata"]
    for name in other_containers:
        try:
            client.containers.get(name).stop()
            details.append(f"{name}: stopped")
        except Exception as e:
            details.append(f"{name}: {e}")

    def stop_self():
        time.sleep(1.5)
        try:
            client.containers.get("ee-backend").stop()
        except Exception:
            pass

    threading.Thread(target=stop_self).start()

    return jsonify({"status": "success", "details": details})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)