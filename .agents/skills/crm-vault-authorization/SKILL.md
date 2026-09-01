---
name: crm-vault-authorization
description: >-
  Enforces server-side RBAC (Super Admin, Admin, Manager, User) and multi-tenant vault-boundary
  authorization across Next.js server actions, data queries, and audit logging.
---

# CRM & Vault Authorization

This skill provides patterns and procedures for enforcing strict server-side access control, role hierarchies, and vault boundaries.

## Authorization Principles

### 1. Multi-Layer Guard Pattern
Every server action or protected route handler MUST execute guards in sequence:
1. **Authenticated Session Check**: User exists and session is valid.
2. **Account Status Check**: Status must be `active`. Deny `pending_approval`, `suspended`, or `rejected`.
3. **Role & Permission Check**: Check user role against required permission (e.g. `users.approve`, `vaults.manage_members`, `contacts.create`).
4. **Vault Boundary Enforcement**: If accessing vault-scoped resources (contacts, notes, tasks, reminders, diary, attachments), verify the user is an active member of that vault or a Super Admin.
5. **Ownership Check (Role: User)**: Standard `User` role can only edit/delete records they own within their assigned vaults unless specifically granted team-wide edit.

### 2. Role Hierarchy & Guardrails
| Role | Boundary | Restrictions |
|---|---|---|
| **Super Admin** | System-wide, all vaults, all users, audit logs | Cannot demote or suspend the last active Super Admin. |
| **Admin** | CRM data + lower-ranked users (Manager, User) | Cannot create, modify, suspend, or delete Super Admins or modify system settings. |
| **Manager** | Assigned vaults only | Can manage contacts, notes, tasks, reminders, and diary in assigned vaults. Cannot manage users/roles. |
| **User** | Assigned vaults only | Restricted to assigned vaults and own created records. |

### 3. Audit Logging Standard
- Log all security events: signup, verification, approval, rejection, suspension, role assignment, vault membership change, 2FA reset, password change, export.
- Never log raw passwords, TOTP secrets, or unhashed tokens.
- Hash client IP addresses and user agents where needed for privacy compliance.
