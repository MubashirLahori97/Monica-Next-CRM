---
name: auth-security-workflow
description: >-
  Handles approval-gated authentication, email domain verification, TOTP 2FA with AES-GCM encryption,
  WebAuthn passkeys, session management, and persistent/trusted device tokens in Next.js 16 and Auth.js.
---

# Authentication & Security Workflow

This skill defines the security architecture and implementation procedures for the CRM authentication system.

## Core Authentication Architecture

### 1. Account Lifecycle States
```text
signup → pending_email_verification → pending_approval → active → suspended
                                             └────────→ rejected
```

- **Domain Restriction**: Check normalized user email against `ALLOWED_EMAIL_DOMAINS` (e.g. `tkxel.com`). Refuse non-allowlisted emails immediately.
- **Verification**: Generate high-entropy 32-byte one-time token, store hashed with expiration (e.g. 24h). Send link via Mailpit (dev) or SMTP. On verification, advance to `pending_approval`.
- **Approval Gate**: Super Admin must approve the account before any active session can be issued.
- **2FA Gate**: All active users must enroll TOTP on first approved login. Subsequent logins require TOTP or recovery code unless a valid trusted-device token is present.

### 2. Cryptographic Standards
- **Password Hashing**: Argon2id or bcrypt (cost factor >= 12).
- **2FA Secrets at Rest**: Authenticated encryption using **AES-256-GCM** with unique 12-byte initialization vectors (IVs) and auth tags. Store `iv:tag:ciphertext`. Key must be derived from `APP_KEY` or dedicated `TWO_FACTOR_ENCRYPTION_KEY`.
- **Tokens & Recovery Codes**: Store only SHA-256 / argon2 hashes of verification tokens, password reset tokens, recovery codes, persistent login tokens, and trusted device tokens.

### 3. Session & Token Consolidation
- Use **Auth.js v5 (NextAuth)** with Prisma Adapter for database sessions.
- Invalidate sessions immediately upon:
  - Account suspension or rejection
  - Password change or reset
  - 2FA reset
  - Role or vault membership modification
  - Explicit sign-out / sign-out all devices

### 4. Persistent Sessions vs. Trusted 2FA Devices
- **Persistent Session ("Keep me signed in")**:
  - Issue opaque rotating token, store hash with user ID, user agent hash, IP hash, and 30-day expiry.
  - Generates a fresh short-lived session on return.
- **Trusted Device 2FA**:
  - Issue distinct rotating token upon 2FA success if user checks "Trust this device".
  - Skips only the repeated TOTP challenge for 30 days. Never skips password, account status, or vault authorization.

### 5. WebAuthn Passkeys
- Support passkeys via `@simplewebauthn/server` and `@simplewebauthn/browser`.
- Store credential ID, public key, sign counter, and transports.
- Passkey users must still pass domain allowlist and Super Admin approval.
