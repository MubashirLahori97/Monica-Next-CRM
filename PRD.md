# PRD — Monica-based CRM with Approval-Gated Authentication

## Product summary

Build a local, internal JavaScript CRM inspired by Monica's relationship-management features—contacts, contact relationships, notes, reminders, tasks, activities, diary entries, labels, uploads and vaults—while controlling who may use them through a custom organization authentication and authorization layer.

Monica is a Laravel/PHP personal relationship management (PRM) system, rather than a conventional sales CRM. This project recreates selected product behaviors in JavaScript; it does not copy Monica's PHP code, frontend assets or branding. [Monica repository](https://github.com/monicahq/monica)

## Reference and licensing boundary

- Use Monica as a product-feature reference only. Do not copy source code, styling, images, text or branding from its repository.
- The application remains a standalone Next.js codebase. Dependencies retain their own licenses and must be recorded before production distribution.
- Document feature references and decisions in this PRD; no upstream merge or source synchronization is required.

## Goals

1. Run the JavaScript CRM locally with an organization-controlled authentication flow.
2. Support email/password and Google OpenID Connect login.
3. Restrict signups to configured corporate domains, such as `@tkxel.com`.
4. Block every new user until a Super Admin approves them.
5. Require TOTP 2FA for all approved users.
6. Enforce roles, permissions and vault access on the server.
7. Audit access-control and sensitive data actions.

## Out of scope (v1)

- Rebuilding Monica's CRM/PRM features from scratch.
- Sales leads, pipeline and revenue reporting.
- SMS 2FA, custom role-builder UI, SCIM, self-service organization creation and passkeys.

## Roles and account lifecycle

| Role | Access |
|---|---|
| Super Admin | Full system, all vaults, users, roles, settings, audit log, 2FA resets. |
| Admin | CRM data and lower-ranked users only; cannot affect Super Admins/settings. |
| Manager | Assigned vaults and allowed CRM data; no user/role management. |
| User | Only assigned vaults and permitted features. |

```text
signup → pending_email_verification → pending_approval → active → suspended
                                             └────────→ rejected
```

1. User registers with allowed email/password or Google verified email.
2. The server checks the exact normalized domain against `ALLOWED_EMAIL_DOMAINS`.
3. After email verification, account status becomes `pending_approval`; no application session is created.
4. Super Admin approves the user, assigns a role and vault access.
5. At first approved login, user must enroll TOTP. Every later login requires TOTP or recovery code.
6. Rejected/suspended users cannot log in; all existing sessions are revoked.

## Authentication requirements

### Email/password

- Require name, email, password and any required consent.
- Hash passwords with Argon2id (bcrypt fallback); minimum 12 characters; never store plaintext.
- Email-verification and password-reset tokens are short-lived, one-time and stored hashed.
- Password-reset responses should not reveal whether an email exists.

### Google sign-in

- Use OAuth 2.0/OpenID Connect authorization-code flow with PKCE and server-side state/nonce validation.
- Accept only provider-verified email claims whose whole domain is allowlisted.
- Google sign-up remains `pending_approval`; it never bypasses approval or 2FA.
- Link accounts only after an authenticated-user confirmation, or through a deliberately configured safe verified-email policy.

### Two-factor authentication

- Use TOTP (Google Authenticator, Microsoft Authenticator, 1Password, etc.).
- Show QR enrollment after approved primary login; verify a code before granting access.
- Generate 8–10 recovery codes. Store their hashes only.
- Encrypt the TOTP secret at rest using an application key distinct from database credentials.
- Only Super Admin can reset 2FA after identity verification; audit and notify the target user.

### Sessions

- Use Laravel database-backed sessions for immediate revocation.
- Production cookies: `HttpOnly`, `Secure`, `SameSite=Lax`. `Secure=false` is allowed only for local `http://localhost` development.
- 8-hour maximum lifetime; 30-minute idle timeout. Regenerate session IDs after login, 2FA and privilege change.
- Revoke target sessions after suspension, rejection, password reset, role/vault change, or 2FA reset.

### Persistent session ("Keep me signed in")

- Offer an optional **Keep me signed in** checkbox. It creates a separate, opaque, rotating remember-device token; it must not extend the normal session cookie indefinitely.
- Store only the token hash, user, device label/user-agent hash, timestamps and expiry. On a later visit, a valid token creates a fresh normal session.
- Default maximum lifetime: 30 days, configurable by Super Admin. Revoke it on sign-out from that device, sign-out-all, password reset/change, 2FA reset, account suspension/rejection, role/vault change or expiry.
- Users can view and revoke remembered devices from Security settings.

### Trusted-device 2FA login

- After successful primary login **and** TOTP verification, offer the choice to trust the current device for 30 days. Never trust automatically or on shared devices.
- Store a separate opaque, rotating, hashed trusted-device token. It skips only a repeated TOTP prompt; it never bypasses account status, password/passkey, role, permission or vault checks.
- Require TOTP again after expiry/revocation, material browser change, sensitive action or suspicious login. Super Admin must re-enter 2FA before high-impact actions such as role changes, 2FA resets and export.
- Show trusted devices in Security settings with per-device and revoke-all controls. Revoke through the same security events as persistent sessions.

### Passkeys (WebAuthn)

- Support passkeys as a preferred primary sign-in method. The browser can offer a saved credential; the user confirms with Face ID, fingerprint, Windows Hello or device PIN.
- Verify WebAuthn assertions on the server. Store credential ID, public key, sign counter, transports and timestamps—never biometric data or private keys.
- Passkey login must still pass allowed-domain, approval status, role and vault checks. A new passkey user remains `pending_approval` until approved.
- For v1, passkeys still require TOTP unless deliberately configured later as a phishing-resistant MFA replacement. Trusted-device bypass remains a separate decision.
- An active user can add/remove passkeys in Security settings; require recent authentication plus TOTP before removal and protect their last sign-in method.

## Authorization model

Use Laravel Gates/Policies and a compatible RBAC package such as `spatie/laravel-permission`. Permission checks are server-side in web/API routes, controllers, jobs, downloads and exports; frontend hiding alone is not authorization.

```text
contacts.read/create/update/delete       relationships.manage
notes.read/create/update/delete          activities.manage
tasks.manage                              reminders.manage
diary.read/create/update/delete           documents.upload/delete
vaults.read/manage_members                users.read/approve/reject/suspend
users.assign_role/reset_2fa               settings.manage
audit_logs.read                            data.export
```

Vaults are the primary data boundary. Users may access only assigned vaults. Ownership policies further restrict Users to their own records where applicable. Admins may never manage equal/higher rank. The last active Super Admin cannot be demoted, suspended or deleted.

## Feature scope

### Preserve from Monica

- Contacts, contact details, labels and favorite contacts.
- Relationships between contacts, custom fields, pets, addresses and contact methods.
- Notes, activities/interactions, tasks, reminders and birthday reminders.
- Diary, photos/documents, custom activity types, currencies, localization and vaults.

### Build or modify

- Public: signup, verify email, sign in, Google callback, reset password, 2FA enrollment/challenge, recovery-code flow, pending page.
- Super Admin: approval queue, user directory, status/role/vault controls, 2FA reset and audit log.
- Admin: lower-role user actions only where permission allows.
- User Security: password change, recovery-code replacement, logout all sessions and active-session list where feasible.
- Friendly denied/pending/suspended screens.

## Technical stack

| Layer | Choice |
|---|---|
| Base app | Monica fork pinned to stable `4.x` revision |
| Backend | Monica's Laravel/PHP architecture |
| Database | Engine supported by the pinned release; MySQL/MariaDB recommended locally unless upstream docs say otherwise |
| Local services | Docker Compose: application, database, Mailpit |
| Social auth | Laravel Socialite / compatible Google OIDC implementation |
| RBAC | Laravel Policies/Gates + compatible Spatie permission package |
| 2FA | Maintained Laravel-compatible TOTP + QR library and Laravel encryption |
| Passkeys | Maintained Laravel-compatible WebAuthn server library |
| Tests | Upstream-compatible PHPUnit/Pest setup |

Do not introduce Next.js, Prisma, PostgreSQL, or a second authentication framework into the Monica fork for v1; it would duplicate its Laravel architecture.

## Data model and migrations

Inspect and reuse the selected Monica branch's existing schema. Add/extend these logical structures using its naming conventions:

```text
users (extend): account_status, approved_by_user_id, approved_at,
  suspended_by_user_id, suspended_at, suspension_reason,
  two_factor_enabled, two_factor_secret_encrypted, last_login_at

social_accounts: user_id, provider, provider_account_id, provider_email,
  encrypted_access_token?, encrypted_refresh_token?, expires_at

email_verification_tokens / password_reset_tokens:
  user_id, token_hash, expires_at, consumed_at

two_factor_recovery_codes: user_id, code_hash, used_at, created_at

passkeys:
  user_id, credential_id (unique), public_key, sign_count, transports_json,
  label, last_used_at, created_at

remembered_devices:
  user_id, token_hash (unique), kind: persistent_session | trusted_2fa,
  device_label, user_agent_hash, created_at, last_used_at, expires_at, revoked_at

roles / permissions / model_has_roles / role_has_permissions
  Seed Super Admin, Admin, Manager and User

vault_memberships (only if Monica's existing model is insufficient):
  vault_id, user_id, membership_role; unique(vault_id, user_id)

audit_logs: actor_user_id?, action, target_type, target_id,
  metadata_json, ip_hash, created_at
```

Never store raw passwords, session/verification/reset tokens, recovery codes, TOTP secrets or OAuth refresh tokens in plaintext. Index account status, provider account IDs, vault memberships and audit target/time.

## Middleware and main actions

Protected routes apply: Laravel session/CSRF → `auth` → `account.active` → `two-factor.confirmed` → required permission → vault membership/ownership policy.

- Registration validates domain, creates pending account and sends verification.
- Verification changes status to `pending_approval`, without a usable session.
- Credentials/Google login checks status, then starts 2FA; only successful 2FA creates full session.
- Passkey login verifies the WebAuthn assertion, then uses the same status and 2FA/trusted-device rules.
- Persistent-login and trusted-device flows use distinct, hashed, rotating tokens; raw tokens are never stored in the database.
- Super Admin approve/reject/suspend/role/vault-membership/2FA-reset actions are transactional, audited and revoke target sessions.
- CRM record access requires both permission and vault policy checks.

## Security and operations

- HTTPS is mandatory in production; localhost HTTP is acceptable during local development.
- Keep `APP_KEY`, DB credentials, Google keys, email keys and allowed domains in untracked `.env` files.
- Rate-limit registration, login, 2FA, reset, verification and admin actions; add progressive delay/temporary lockout for failures.
- Validate all input server-side and authorize uploads, exports and queued jobs.
- Audit signup, verification, approval/status/role/vault changes, sign-in outcomes, 2FA events, exports and destructive data changes.
- Do not log secrets, passwords, raw tokens, recovery codes, raw TOTP data or full raw IP addresses.
- Back up database/uploads, test restores, and define retention before production.

## Environment

```bash
APP_URL=http://localhost
APP_KEY=<laravel-generated-secret>
DB_CONNECTION=mysql
DB_HOST=db
DB_DATABASE=monica_crm
DB_USERNAME=monica
DB_PASSWORD=<local-secret>
ALLOWED_EMAIL_DOMAINS=tkxel.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
```

## Acceptance criteria

1. The selected Monica release runs locally, and its preserved PRM features work for an authorized user.
2. Non-allowlisted credentials and Google identities are refused.
3. A new account cannot access any protected Monica route until verified, approved and enrolled in/completing TOTP.
4. Super Admin can approve/reject/suspend, set role/vault access and reset 2FA; actions are audited.
5. Pending/rejected/suspended accounts are denied by middleware and lose sessions.
6. All roles are restricted by permission plus vault membership; guessed URLs/APIs do not bypass rules.
7. Admin cannot manage equal/higher roles; the final active Super Admin is protected.
8. Tests cover domain gate, approval gate, Google callback, TOTP, role hierarchy, vault boundaries, session revocation and audit logging.
9. License/attribution and upstream revision documentation remain in the fork.
10. Users can opt into persistent login and trusted devices, view/revoke each device, and both expire after 30 days by default.
11. Passkey enrollment/sign-in/removal is secure; no biometric data or private key is stored by the app.

## Implementation phases

1. Fork/pin Monica `4.x`, document license/upstream commit, run baseline with Docker, inspect schema.
2. Add email-domain validation, verification, statuses, Super Admin seed, approval screens and status middleware.
3. Add Google sign-in, passkeys, TOTP, recovery codes, persistent/trusted-device tokens, session revocation, reset flows and rate limits.
4. Add roles, permissions, vault policies, admin UI and audit log.
5. Regression/security testing, local setup guide and upstream-update procedure.

## Decisions required before coding

- Confirm allowed domain(s) and initial Super Admin email.
- Confirm 2FA is mandatory for all active users (this PRD assumes yes).
- Confirm Google is a fallback alongside passwords or the preferred login.
- Confirm whether Users can view all records in assigned vaults or only records they own.
- Confirm acceptance of AGPL-3.0 obligations before public/network deployment.
