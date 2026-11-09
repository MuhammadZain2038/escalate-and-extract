# ☁️ Escalate & Extract

### Break the Cloud. Capture the Flags. Master the Misconfigurations.

**What happens when a cloud environment is misconfigured?**

Can you find an exposed storage bucket? Abuse an overly trusting IAM role? Or turn an innocent-looking URL fetcher into a credential-stealing attack?

**Escalate & Extract** is a self-hosted, gamified cloud attack range that puts you in the attacker's shoes. Explore real-world AWS misconfiguration scenarios, exploit vulnerable infrastructure, and capture session-unique flags — all inside a local AWS emulator.

🎮 **Learn first. Exploit next. Capture the flag.**

No real AWS account. No cloud bills. No accidental attacks on production infrastructure.

Just you, your terminal, and a cloud environment waiting to be compromised.

Built as a combined project for **Information Assurance and Cloud Security coursework.**

<img width="1920" height="1080" alt="main meu" src="https://github.com/user-attachments/assets/ef1d21e3-339d-4280-b6af-337109dfb3da" />


---

## 🎮 Your Mission: Escalate & Extract

Three difficulty levels. Three attack scenarios. Two ways to play.

Choose your path:

| 🎯 Tier | 💥 Attack Scenario | 🕵️ Your Mission |
|---|---|---|
| 🟢 **Easy** | Public S3 Bucket Exposure | Discover an exposed storage bucket, enumerate its contents, and extract data without using any credentials. |
| 🟡 **Medium** | IAM Trust Misconfiguration | Hunt down leaked credentials, identify a vulnerable trust relationship, and assume a role you were never supposed to access. |
| 🔴 **Hard** | SSRF → Credential Theft | Exploit a vulnerable web application's fetch functionality to reach an internal metadata service and steal cloud credentials. |

### 🧠 Learn It. Then Break It.

Every tier offers two distinct experiences:

- **📖 Walkthrough Mode** — Learn the attack through a guided, image-driven explanation narrated by an interactive instructor cube. Understand the vulnerability, the attack path, and the techniques involved before attempting the challenge yourself.
- **⚔️ CTF Mode** — Step into a genuinely vulnerable, randomized environment. Enumerate services, use real AWS CLI tooling, discover misconfigurations, and exploit the infrastructure manually to capture your flag.

No two sessions are exactly alike.

Every flag is generated fresh when a session launches. Your performance is tracked through a scoring system that considers:

- 🏁 Challenge completion
- ⏱️ Time taken
- 🔄 Number of attempts
- 💡 Whether hints were used

Your progress feeds into a **live, shared scoreboard**, turning individual exploitation into a competitive challenge.

---

## 🏗️ Under the Hood

Escalate & Extract combines a local AWS attack range with a lightweight orchestration backend and a shared leaderboard.

| Component | Role in the Range |
|---|---|
| **LocalStack** | Emulates AWS services locally, including S3, IAM, STS, and EC2 APIs. |
| **Terraform** | Deploys each vulnerable environment with session-specific parameters. |
| **Flask Backend** | Orchestrates Terraform deployments, validates exploitation, and exposes the application API. |
| **Static Frontend + Nginx** | Serves the interactive game interface. |
| **SSRF-Vulnerable Web App** | Provides the attack surface for the Hard tier. |
| **Fake Metadata Service** | Simulates an internal-only cloud metadata endpoint, isolated within Docker's internal network. |
| **Scoreboard API** | A separately hosted Flask API with PostgreSQL on Supabase, enabling a shared leaderboard across players. |

The attack range itself runs locally. The scoreboard is the only externally hosted component, allowing players to compete without requiring a centralized cloud attack environment.

---

## 🚀 Get Started

Ready to compromise your first cloud environment?

### Prerequisites

- Docker Desktop
- A free LocalStack Hobby account
- A LocalStack Auth Token

### 1. 🔑 Get Your LocalStack Token

Create a free account at [LocalStack Cloud](https://app.localstack.cloud) and copy your Auth Token from the dashboard.

> LocalStack requires an account-backed token for its current free offering. Each container needs an account behind it, so this is a standard setup requirement for LocalStack-based projects.

### 2. ⚙️ Configure Your Environment

Copy `.env.example` to `.env` and add your token:

```env
LOCALSTACK_AUTH_TOKEN=your-token-here
```

### 3. 🎮 Launch the Attack Range

Run the launcher:

```bat
start.bat
```

The launcher handles the setup for you:

- Checks whether Docker is available
- Starts Docker if needed
- Builds and launches the required containers
- Opens the application in your browser

Once everything is ready, head to:

**http://localhost:8000**

Your attack range is live. Time to find your first vulnerability.

### 4. 🛑 Exit or Clean Up

When you're done playing:

- **In-app Exit:** Stops all containers cleanly while keeping your project files and installed images intact.
- **`uninstall.bat`:** Performs a full teardown by removing containers and images. Your project files remain untouched.

---

## ⚠️ Known Limitations

This project is designed as a practical learning environment, not a perfect replica of production AWS. Here are the limitations worth understanding before you play.

### LocalStack IAM Validation

LocalStack's free tier does not enforce real IAM authorization or perform full cryptographic credential validation.

Easy and Hard tiers are unaffected because their vulnerability mechanics and verification do not depend on this behavior.

Medium tier's credential verification is therefore best-effort. It checks whether submitted credentials resolve to the expected identity through LocalStack's STS mock, but cannot guarantee the same cryptographic strictness enforced by real AWS.

Hard tier avoids this limitation by having the backend independently generate and directly compare credentials rather than relying on LocalStack's validation.

### Single-Player Session Design

Session state is maintained in memory per tier, rather than per player.

This is intentionally designed for local, single-player use. Concurrent multiplayer sessions are not currently supported.

### Shared Scoreboard Availability

The scoreboard runs on a time- and usage-limited free hosting tier.

If the scoreboard goes offline, the core attack range continues to function locally. Only the shared leaderboard requires an active internet connection.

---

## 🛠️ Built With

`Terraform` · `LocalStack` · `Flask` · `Docker` · `AWS CLI` · `Python` · `HTML` · `CSS` · `JavaScript` · `PostgreSQL`

## 🙌 Credits & Inspiration

Escalate & Extract draws inspiration from the broader cloud security training ecosystem, including tools such as [CloudGoat](https://github.com/RhinoSecurityLabs/cloudgoat) and CloudFoxable.

Its contribution is not the invention of new vulnerability classes, but the combination of:

- A tiered cloud exploitation experience
- A dual-mode, teach-then-test approach
- Session-unique flags
- Performance-based scoring
- A shared competitive scoreboard
- A locally hosted, AWS-emulated attack range

**Built for learning. Designed for exploitation. Inspired by real-world cloud security challenges.**

If you're interested in cloud security, IAM exploitation, or hands-on offensive security, this project is for you.

⭐ If you find this project interesting, consider giving it a star!
