# Project System Overview & Architecture Memory

## 1. Project Mission
This application is a privacy-first, enterprise-grade Personal & Team Relationship CRM (Monica-style architecture) built on Next.js 16 (App Router), TypeScript, and PostgreSQL with Prisma ORM. It provides private-by-default multi-tenant vaults, contact management, notes, tasks, reminders, diary journals, activities, and an approval-gated authentication system with TOTP 2FA, passkeys, and audit trails.

---

## 2. Core Technology Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database & ORM**: PostgreSQL with Prisma ORM (Prisma Client v6)
- **Styling**: Tailwind CSS v4 with custom utility tokens
- **Authentication**: Auth.js v5 (NextAuth) + Custom Session & Security Engine
  - Credentials & Google OAuth
  - WebAuthn / Passkeys (`@simplewebauthn`)
  - TOTP 2FA (`otplib`, `qrcode`)
  - Domain verification (`tkxel.com` whitelist)
  - Super Admin approval gate before workspace activation
- **Encryption**: AES-256 (Secrets & 2FA Tokens)
- **Audit Logging**: Append-only `AuditLog` table with IP, User Agent, and target metadata

---

## 3. Directory Layout & Architecture
```text
auth-module/
├── .agents/                   # Customizations root (Agent Personas, Skills, Memory, Rules)
│   ├── agents/                # Specialist agent personas & orchestrator
│   ├── memory/                # Project memory store & decision logs
│   ├── rules/                 # Coding guidelines & security guardrails
│   └── skills/                # Production-grade engineering workflows
├── prisma/
│   ├── schema.prisma          # PostgreSQL relational schema
│   └── seed.ts                # Bootstrap script (roles, admin, default vault)
├── src/
│   ├── actions/               # Server Actions (Mutations & Data Writes)
│   │   ├── admin.actions.ts
│   │   ├── auth.actions.ts
│   │   ├── contact.actions.ts
│   │   ├── crm.actions.ts
│   │   ├── diary.actions.ts
│   │   ├── note.actions.ts
│   │   ├── reminder.actions.ts
│   │   └── task.actions.ts
│   ├── app/                   # App Router Layouts & Pages
│   │   ├── (app)/             # Authenticated workspace routes
│   │   │   ├── admin/users/
│   │   │   ├── companies/
│   │   │   ├── contacts/
│   │   │   ├── dashboard/
│   │   │   ├── deals/
│   │   │   ├── diary/
│   │   │   ├── reminders/
│   │   │   ├── tasks/
│   │   │   ├── vaults/
│   │   │   └── layout.tsx
│   │   ├── (auth)/            # Authentication flows
│   │   │   ├── 2fa/
│   │   │   ├── pending-approval/
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   └── verify-email/
│   │   ├── api/auth/          # Auth.js route handlers
│   │   ├── error/
│   │   └── layout.tsx
│   ├── components/            # Modular React components
│   │   ├── admin/             # Admin moderation controls
│   │   ├── auth/              # Auth forms (EnrollForm, LoginForm)
│   │   ├── crm/               # CRM widgets & cards
│   │   ├── layout/            # AppHeader, Navbar, Sidebar
│   │   └── ui/                # Base UI elements
│   ├── lib/                   # Core business logic & engines
│   │   ├── audit.ts           # Security audit logging engine
│   │   ├── crypto.ts          # Encryption & hashing helpers
│   │   ├── db.ts              # Prisma singleton instance
│   │   ├── permissions.ts     # RBAC & Vault access gatekeeper
│   │   ├── session.ts         # User session resolution & cache
│   │   └── utils.ts           # Class merging & formatters
│   ├── types/                 # TypeScript definitions & ambient declarations
│   │   ├── index.ts           # Application domain types
│   │   └── next-auth.d.ts     # NextAuth session/user augmentation
│   ├── auth.ts                # Auth.js provider & callback setup
│   └── middleware.ts          # Route protection middleware
└── PROJECT_MEMORY.md          # Master memory index
```

---

## 4. Key Architectural Patterns
1. **Private-by-Default Vault Boundaries**: Every contact, note, task, reminder, and diary entry belongs to a `Vault`. Users can only read/mutate records if they have an active `VaultMembership` (or are Super Admin with rank 1).
2. **Server Action Security Flow**:
   - Resolve session (`await getSession()`).
   - Verify `accountStatus === 'active'` and `!twoFactorPending`.
   - Check RBAC permissions (`requirePermission('permission.name')`).
   - Validate input with Zod.
   - Verify Vault membership (`checkVaultAccess(userId, vaultId)`).
   - Perform mutation in transaction if needed.
   - Record immutable `logAuditAction(...)`.
   - Call `revalidatePath(...)`.
