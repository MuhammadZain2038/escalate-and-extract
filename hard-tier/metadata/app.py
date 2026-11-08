from flask import Flask, jsonify, request

app = Flask(__name__)

# Updated by the backend at launch time — this is this session's
# stolen-able credential, scoped to the role Terraform just created.
state = {"role_name": None, "access_key": None, "secret_key": None, "session_token": None}

@app.route("/admin/set-credentials", methods=["POST"])
def set_credentials():
    data = request.get_json(force=True)
    state["role_name"] = data.get("role_name")
    state["access_key"] = data.get("access_key")
    state["secret_key"] = data.get("secret_key")
    state["session_token"] = data.get("session_token")
    return jsonify({"status": "ok"})

# Real AWS IMDS structure: calling this path with no role name
# returns just the role name as plain text — mirroring that exactly.
@app.route("/latest/meta-data/iam/security-credentials/", methods=["GET"])
@app.route("/latest/meta-data/iam/security-credentials", methods=["GET"])
def list_role():
    if not state["role_name"]:
        return "", 404
    return state["role_name"], 200, {"Content-Type": "text/plain"}

@app.route("/latest/meta-data/iam/security-credentials/<role_name>", methods=["GET"])
def get_credentials(role_name):
    if not state["role_name"] or role_name != state["role_name"]:
        return "", 404
    return jsonify({
        "Code": "Success",
        "Type": "AWS-HMAC",
        "AccessKeyId": state["access_key"],
        "SecretAccessKey": state["secret_key"],
        "Token": state["session_token"],
        "Expiration": "2026-12-31T00:00:00Z"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)