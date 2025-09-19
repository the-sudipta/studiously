<!-- README.md — HTML+CSS-in-Markdown (copy–paste this whole block into your README.md) -->

<!-- ====== Title Card ====== -->
<div align="center" style="font-family: ui-sans-serif, system-ui, Segoe UI; line-height:1.55; color:#e5e7eb; background:#0b1220; padding:28px 18px; border-radius:16px; border:1px solid #1f2a44;">
  <h1 style="margin:0 0 6px; font-size:36px;">⚙️ Studiously — Member Auth & Password Reset (NestJS)</h1>
  <p style="margin:0 0 12px; opacity:.9;">JWT login, OTP-based “forgot password”, secure mail transport, and guards — production-ready patterns.</p>
  <p style="margin:0;">
    <img alt="NestJS"   src="https://img.shields.io/badge/NestJS-Framework-EA2845?logo=nestjs&logoColor=white" />
    <img alt="TypeORM"  src="https://img.shields.io/badge/TypeORM-Data%20Mapper-F59E0B" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-14+-316192?logo=postgresql&logoColor=white" />
    <img alt="Node"     src="https://img.shields.io/badge/Node-18+-3C873A?logo=node.js&logoColor=white" />
    <img alt="License"  src="https://img.shields.io/badge/License-MIT-38BDF8" />
  </p>
</div>

<!-- ====== Divider ====== -->
<div align="center">
  <svg width="780" height="18" viewBox="0 0 780 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="9" x2="780" y2="9" gradientUnits="userSpaceOnUse"><stop stop-color="#38BDF8"/><stop offset="0.5" stop-color="#A78BFA"/><stop offset="1" stop-color="#F472B6"/></linearGradient></defs>
    <rect x="0" y="8" width="780" height="2" rx="1" fill="url(#g)"/>
  </svg>
</div>

## ✨ Features
- 🔐 **JWT Auth** (HS256) with single global `JwtModule` config and custom guard  
- 📨 **Forgot Password via OTP** (single active OTP per user, expiry-safe)
- ✉️ **Email** via Mailtrap or Gmail (STARTTLS 587) with clear TLS rules
- 🧱 **TypeORM** entities & DB-safe upsert for OTP (unique `userId`)
- 🛡️ **Best practices**: blacklist hooks, consistent secrets, one-time tokens
- 🧰 **Postman-friendly** endpoints with explicit 200/400/401/500 responses

---

## 🧭 Project Structure
```text
studiously/
|-- 📁 src
|   |-- 📁 member
|   |   |-- 📁 entities
|   |   |-- 📁 dtos
|   |   |-- 📁 auth
|   |   |-- 📄 member.module.ts
|   |   |-- 📄 member.service.ts
|   |   |-- 📄 mapper.service.ts
|   |   |-- 📄 member.controller.ts
|   |-- 📁 config
|   |   |-- 📄 roles.ts
|   |-- 📁 admin
|   |-- 📄 app.service.ts
|   |-- 📄 main.ts
|   |-- 📄 app.module.ts
|   |-- 📄 app.controller.spec.ts
|   |-- 📄 app.controller.ts
|-- 📁 test
|   |-- 📄 jest-e2e.json
|   |-- 📄 app.e2e-spec.ts
|-- 📁 node_modules
|-- 📁 dist
|-- 📄 README.md
|-- 📄 package.json
|-- 📄 tsconfig.json
|-- 📄 tsconfig.build.json
|-- 📄 package-lock.json
|-- 📄 .gitignore
|-- 📄 .env
|-- 📄 .prettierrc
|-- 📄 nest-cli.json
|-- 📄 eslint.config.mjs
```

---

## 🚀 Quick Start

```bash
# 1) Install
npm i

# 2) Create database (PostgreSQL) and set DATABASE_URL (or separate vars)
# 3) Configure .env (see below)
# 4) Run
npm run start:dev
```

> **Tip:** Keep only **one** global `JwtModule.register({ global:true, secret, signOptions })` (in `AuthModule`). Do **not** re-register it in feature modules.

---

## ⚙️ Environment (.env example)

```dotenv
# ===== App =====
NODE_ENV=development
PORT=3000

# ===== Database (example) =====
DATABASE_URL=postgres://user:pass@localhost:5432/studiously

# ===== JWT =====
# Generate a strong random Base64 key (32 bytes):
# macOS/Linux: openssl rand -base64 32
# Windows PS:  [Convert]::ToBase64String((1..32 | % {Get-Random -Max 256}))
# Node:        node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_CUSTOM_SECRET=REPLACE_ME
JWT_ACCESS_EXPIRES_IN=15m

# ===== Mail (pick one transport) =====

# --- Mailtrap (recommended for dev) ---
MAILER_HOST=sandbox.smtp.mailtrap.io
MAILER_PORT=2525
MAILER_USER=REPLACE
MAILER_PASSWORD=REPLACE

# --- OR Gmail (App Password + 2FA) ---
#MAILER_HOST=smtp.gmail.com
#MAILER_PORT=587
#MAILER_USER=your@gmail.com
#MAILER_PASSWORD=16char_app_password
```

**Mail transport rules (important):**
- **Port 2525/587 (STARTTLS)** → `secure: false`, `requireTLS: true`  
- **Port 465 (implicit TLS)** → `secure: true` _(no `requireTLS`, no `ignoreTLS`)_

---

## 🔌 Run Migrations (if you use TypeORM CLI)

```bash
# Example commands – adapt to your setup
npm run typeorm:run
# Ensure Otp table has UNIQUE (userId)
```

---

## 📡 API — Endpoints (Minimal)

| Method | Path                                   | Auth           | Body / Notes |
|-------:|----------------------------------------|----------------|--------------|
| POST   | `/api/member/signup`                   | ❌             | `{ email, password }` (password hashed once) |
| POST   | `/api/member/auth/login`               | ❌             | `{ email, password }` → `{ access_token }` |
| GET    | `/api/member/access_token_validation`  | ✅ Bearer JWT  | 200 if valid |
| POST   | `/api/member/forget_password`          | ❌             | `{ email }` → sends OTP mail + returns short-lived token (to authorize OTP/Reset steps) |
| POST   | `/api/member/otp`                      | ✅ Bearer (from previous step) | `{ otp }` → `{ success, message }` |
| POST   | `/api/member/auth/change_password`     | ✅ Bearer (same) | `{ password }` → `{ success, affected }` |

<details>
<summary><b>📬 Sample Requests</b></summary>

**Login**
```http
POST /api/member/auth/login
Content-Type: application/json

{ "email": "user@domain.com", "password": "MyPassw0rd!" }
```

**Validate Token**
```http
GET /api/member/access_token_validation
Authorization: Bearer <JWT>
```

**Forgot Password**
```http
POST /api/member/forget_password
Content-Type: application/json

{ "email": "user@domain.com" }
```

**OTP Verify** (use JWT returned/authorized by previous step)
```http
POST /api/member/otp
Authorization: Bearer <JWT>
Content-Type: application/json

{ "otp": "123456" }
```

**Change Password** (after OTP ok)
```http
POST /api/member/auth/change_password
Authorization: Bearer <JWT>
Content-Type: application/json

{ "password": "N3wPassw0rd!" }
```
</details>

---

## ✅ Implementation Notes (what’s inside)

- **Single global JwtModule** — consistent `secret` and `expiresIn` for sign/verify.  
- **Guard** returns **401** (`UnauthorizedException`) on invalid/expired tokens.  
- **OTP table** enforces **one active OTP per user** (`UNIQUE (userId)`), and we **fetch latest** by `ORDER BY id DESC`.  
- **Hash exactly once** during signup & change-password (avoid double-hash bugs).  
- **Mailer** supports Mailtrap (dev) and Gmail (prod/dev with App Password).  
- **Consistent JSON responses** (no raw `true/false`).

---

## 🧪 Common Errors & Fixes

| Symptom / Error | Cause | Fix |
|---|---|---|
| `401 Invalid or expired access token` | Mismatched JWT secret or expired token | Register **one** global `JwtModule`; use same secret; relogin |
| `ssl3_get_record: wrong version number` | TLS flags don’t match SMTP port | Use **587/2525** with `secure:false, requireTLS:true` or **465** with `secure:true` only |
| `535-5.7.8 Username and Password not accepted` | Gmail rejecting login | Use **App Password** (2FA on), same `MAILER_USER`, try DisplayUnlockCaptcha |
| OTP “did not match” | Picking old OTP row | Fetch **latest** OTP (`ORDER BY ... DESC`), or upsert/unique by `userId` |
| Password incorrect after reset | Double hashing | Hash **only once** (controller **or** service), overwrite with new single-hash |

---

## 🔒 Security Tips
- Keep `JWT_CUSTOM_SECRET` long & random (Base64 32 bytes).  
- Don’t log tokens/OTP in production.  
- Invalidate/reset tokens after password change (blacklist if implemented).  
- Delete OTP row after successful verification.

---

## 🧭 Contributing
1. Fork & create a feature branch.  
2. Follow commit style (type → title → description), e.g.  
   ```
   ✨ feat
   Add OTP upsert and latest-lookup
   - Upsert OTP by userId (unique)
   - Fetch latest OTP with order DESC
   ```
3. Open PR with screenshots of Postman tests.

---

## 📜 License
MIT © Studiously Team

<div align="center" style="margin-top:10px; opacity:.7;">
  Built with ❤️ using NestJS.
</div>
