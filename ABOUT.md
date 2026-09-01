# 🛡️ Monica Next CRM & Enterprise Auth Platform

> **A modern, privacy-first personal & team relationship management (CRM) platform inspired by Monica CRM, built with Next.js 16, React 19, Auth.js v5, Prisma ORM, and enterprise-grade multi-tenant security.**

---

## 📖 1. Project Overview

**Monica Next CRM** bridges the gap between powerful personal relationship tracking and hardened enterprise authorization. It allows individuals and collaborative teams to organize personal networks, log interactions, visualize family/work relationship graphs, track important life milestones, write daily journal reflections with mood tracking, and securely store sensitive files inside **private-by-default isolated Vaults**.

### 🌟 Key Highlights
* **Private-by-Default Multi-Tenancy**: Every contact, note, task, diary entry, and attachment belongs strictly to an isolated **Vault**. Access is gated by vault membership roles (`owner`, `editor`, `viewer`).
* **Multi-Layered Security & Compliance**: Auth.js v5 with approval-gated signups, corporate domain enforcement, AES-256-GCM encrypted TOTP 2FA, WebAuthn Passkeys, active session revocation, and immutable audit logs.
* **Rich CRM Feature Suite**: Global Command Palette (`Cmd+K`), Contact Relationship Network Graph, Interactive Chronological Activity Timeline, Important Dates & Milestones Engine, Personal Diary with Sentiment Tracking, and vCard / CSV bulk import & export.
* **Agent Skills & Autonomous Architecture**: 14+ standardized engineering skills following the `addyosmani/agent-skills` specification located in `.agents/skills/` with master memory stores.

---

## 🛠️ 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router + Turbopack) | Server Components, Server Actions, Dynamic Layouts |
| **Frontend** | React 19 & Tailwind CSS | Responsive, dark-mode-first glassmorphic UI |
| **Database & ORM** | Prisma ORM with SQLite / PostgreSQL | Strongly-typed schema migrations and relationships |
| **Authentication** | Auth.js v5 (NextAuth.js) | Session management, Google OAuth 2.0, WebAuthn Passkeys |
| **Cryptography** | Node.js `crypto` & `otplib` | AES-256-GCM secret encryption, SHA-256 token hashing |
| **Type Safety** | TypeScript 5 (Strict Mode) | Full-stack end-to-end type safety |

---

## 🚀 3. Features & Capabilities

### 🔐 A. Authentication & Security Guardrails
1. **Approval Gate & Domain Whitelist**: New registrations require email verification and administrative review before account activation.
2. **Encrypted TOTP 2-Factor Authentication**: Authenticator apps (Google Authenticator, 1Password) supported with secrets encrypted at rest via AES-256-GCM.
3. **FIDO2 / WebAuthn Hardware Passkeys**: Touch ID, Face ID, Windows Hello, and YubiKey biometric sign-in.
4. **Active Session & Device Management**: Live overview of authenticated browser sessions with one-click individual revocation and *"Sign out all other devices"*.
5. **Trusted Device 2FA Bypass**: Optional 30-day remembered device tokens.
6. **Comprehensive Security Audit Logging**: Automatic structured audit logs for logins, role changes, user approvals, 2FA modifications, and vault operations.

### 👥 B. Monica CRM Domain Engine
1. **Universal Command Palette (`Cmd+K` / `Ctrl+K`)**: Instant fuzzy search across contacts, vaults, tasks, and system navigation.
2. **Contact Network & Relationship Visualizer**: Interactive graph mapping relationships between contacts across **Family & Partners**, **Work & Professional**, and **Friends & Social** networks.
3. **Interactive Contact Activity Timeline**: Unified chronological event stream recording phone calls, meetings, coffee chats, emails, notes, tasks, and reminders.
4. **Important Dates & Milestone Engine**: Real-time countdown badges (*"Today! 🎉"*, *"In 3 days"*) with automated yearly recurrence sync for birthdays and wedding anniversaries.
5. **Daily Diary & Mood Journal**: Personal reflections with mood sentiment indicators (*🌟 Great, 😊 Good, 😐 Neutral, 🌧️ Challenging*), calendar navigation, and clickable `@mention` contact tagging.
6. **File & Document Attachments**: Upload documents, contracts, PDFs, and photos (up to 15MB) linked to contact profiles.
7. **vCard (.vcf) & CSV Import / Export**: Instant bulk export of vault contacts to industry-standard vCard 3.0 or CSV, and parser for bulk imports.

---

## 🏛️ 4. Architecture & Directory Layout

```text
auth-module/
├── .agents/                      # Autonomous Agent & Skills Ecosystem
│   ├── agents/                   # Specialist personas (architect, security, frontend, qa, devops)
│   ├── memory/                   # Master project memory, decision logs, domain models
│   ├── rules/                    # Architectural constraints and security guardrails
│   └── skills/                   # 14+ specialized workflow and domain skills
├── prisma/
│   ├── schema.prisma             # Database models (User, Vault, Contact, Activity, Diary, etc.)
│   └── seed.ts                   # Bootstrapping script for roles and super admin
├── public/                       # Static assets and uploaded attachments
├── src/
│   ├── actions/                  # Next.js Server Actions (Contact, Security, Diary, IO, Admin)
│   ├── app/                      # Next.js 16 App Router pages and route handlers
│   │   ├── (app)/                # Authenticated CRM layout (Contacts, Diary, Reminders, Vaults, Admin)
│   │   ├── (auth)/               # Auth flows (Sign In, Sign Up, 2FA, Verify Email, Passkeys)
│   │   └── api/                  # API endpoints and Auth.js route handlers
│   ├── components/               # Reusable React 19 UI components
│   │   ├── admin/                # User directory and audit log tables
│   │   ├── crm/                  # Timelines, Graphs, Diary, Milestones, Importers
│   │   ├── layout/               # Sidebar, AppHeader, Mobile Navigation
│   │   ├── security/             # ActiveSessions, Passkeys, TrustedDevices cards
│   │   └── ui/                   # CommandPalette, Modals, Badges, Buttons
│   ├── lib/                      # Core helpers (Auth, Prisma DB, Crypto, Permissions, Audit)
│   └── types/                    # Centralized TypeScript declarations
├── ABOUT.md                      # Project architecture and technical specification
├── PROJECT_MEMORY.md             # Master project context and index
└── README.md                     # Quickstart guide
```

---

## ⚡ 5. Quickstart & Local Setup

### Prerequisites
* **Node.js**: v18.18.0 or higher
* **npm** or **pnpm**

### Installation & Launch

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment Variables (`.env`)**:
   ```env
   DATABASE_URL="file:./dev.db"
   AUTH_URL="http://localhost:3000"
   AUTH_SECRET="super_secret_dev_only_12345"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="super_secret_dev_only_12345"
   DATA_ENCRYPTION_KEY="l8wW+NPBxTSxfcY2blhSFlJ0Hwu+fJyFI0kKwBLImk0="
   ALLOWED_EMAIL_DOMAINS="tkxel.com,gmail.com"

   # Initial Super Admin
   INITIAL_SUPER_ADMIN_EMAIL="admin@tkxel.com"
   INITIAL_SUPER_ADMIN_PASSWORD="Admin12345678!"
   ```

3. **Deploy Database & Seed**:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Default Credentials

| Account | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@tkxel.com` | `Admin12345678!` | Super Admin (Rank 1) |
| **Backup Super Admin** | `superadmin@tkxel.com` | `Admin12345678!` | Super Admin (Rank 1) |

---

## 📜 6. Security & Quality Standards

- **Strict Validation**: All server actions validate payloads with Zod schemas and check `accountStatus === 'active'`.
- **Vault Authorization**: Multi-tenant boundaries enforced on every query (`WHERE vaultId = currentVault.id`).
- **Static Verification**: Zero ESLint warnings, strict TypeScript compilation (`npx tsc --noEmit`), and verified Next.js production builds (`npm run build`).
