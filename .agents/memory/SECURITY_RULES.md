# Security & Authorization Memory

## 1. Authentication Lifecycle & States

```text
[ Sign Up ]
     │
     ▼
( pending_email_verification ) ──[ Click Email Link ]──▶ ( pending_approval )
                                                                 │
                                                   [ Super Admin Approves ]
                                                                 │
                                                                 ▼
                                                            ( active )
                                                                 │
                                                    [ 2FA Enrollment Check ]
                                                                 │
                                                   ┌─────────────┴─────────────┐
                                                   ▼                           ▼
                                            [ Enrolled ]               [ Unenrolled ]
                                                   │                           │
                                            ( 2FA Prompt )             ( Force Enroll )
                                                   │                           │
                                                   ▼                           ▼
                                            [ Access CRM ]              [ Access CRM ]
```

---

## 2. Security Invariants & Rules

1. **Email Domain Whitelisting**:
   - Only emails matching `ALLOWED_EMAIL_DOMAINS` (`tkxel.com`) can create accounts or sign in via Google OAuth.
2. **Super Admin Approval Gate**:
   - Accounts cannot access any CRM routes or execute mutations while in `pending_email_verification`, `pending_approval`, `suspended`, or `rejected`.
3. **MFA / 2FA Enforcement**:
   - If `twoFactorEnabled === true`, a valid TOTP token or single-use recovery code is required on every new session unless a valid `trusted_device` token is present.
4. **Data Isolation (Vault Scoping)**:
   - Queries must always filter by `vaultId IN (user_permitted_vaults)`.
   - Direct entity lookups (e.g. `findUnique({ where: { id } })`) must verify that the entity's `vaultId` belongs to the requesting user's vault memberships.
5. **Encryption & Key Handling**:
   - TOTP secrets and sensitive tokens are encrypted using AES-256 with `DATA_ENCRYPTION_KEY`.
   - Passwords use `bcryptjs` with salt rounds >= 12.
   - Raw secrets or passwords must **never** be logged or sent to client components.
6. **Audit Trail**:
   - Any sensitive operation (`auth.signin`, `user.approve`, `user.suspend`, `vault.create`, `2fa.reset`, `contact.delete`) must invoke `logAuditAction(...)`.
