---
trigger: always_on
---

# CRM Development Rules & Guardrails

## 1. Architecture & Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript.
- **ORM & Database**: Prisma with PostgreSQL.
- **Styling**: Modern, responsive UI with Tailwind CSS.
- **Auth**: Auth.js v5 with approval gate, email domain verification, TOTP 2FA, and Passkeys.

## 2. Server Action & Security Standards
- Always validate input with Zod schemas.
- Check user authentication and ensure `accountStatus === 'active'`.
- Enforce Vault membership check on every vault-scoped entity query and mutation.
- Log sensitive operations to the `AuditLog` table.
- Never return or log raw passwords, TOTP secrets, or sensitive tokens.

## 3. Database & Code Integrity
- Run Prisma migrations cleanly without `--accept-data-loss`.
- Maintain zero ESLint errors and strict TypeScript compilation (`npm run lint`, `npm run build`).
