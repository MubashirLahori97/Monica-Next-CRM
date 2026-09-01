# 🛡️ Monica Next CRM

<div align="center">

![Next.js 16](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)
![Auth.js](https://img.shields.io/badge/Auth.js-v5-purple?style=for-the-badge&logo=auth0)

**A modern, privacy-first personal & team relationship management (CRM) platform inspired by Monica CRM.**
*Engineered with Next.js 16 App Router, React 19, Auth.js v5, Prisma ORM, and enterprise-grade multi-tenant security.*

[Features](#-key-features) • [Tech Stack](#-technology-stack) • [Quickstart](#-quickstart--local-setup) • [Architecture](#-architecture) • [Security](#-security--guardrails) • [Default Credentials](#-default-credentials)

</div>

---

## 📖 Overview

**Monica Next CRM** is a centralized, secure platform designed for individuals and teams to organize relationships, track interactions, visualize connection networks, preserve important milestones, keep reflective journals, and securely manage files.

Every piece of data is encapsulated within private-by-default, isolated **Vaults**, guaranteeing complete multi-tenant boundaries and granular role-based access control (`Owner`, `Editor`, `Viewer`).

---

## 🌟 Key Features

### 👥 Comprehensive CRM & Relationship Management
- **Universal Command Palette (`Cmd + K` / `Ctrl + K`)**: Instant search and fast navigation across contacts, vaults, tasks, and system routes.
- **Interactive Relationship Network Graph**: Visualizes connections between contacts categorized by *Family & Partners*, *Work & Professional*, and *Friends & Social*.
- **Unified Activity Timeline**: Chronological stream capturing meetings, phone calls, coffee catch-ups, emails, notes, tasks, and reminders.
- **Important Dates & Milestone Engine**: Real-time countdowns (*"Today! 🎉"*, *"In 3 days"*) with automated annual recurring reminders for birthdays and anniversaries.
- **Personal Diary & Mood Journal**: Daily reflective entries with mood indicators (*🌟 Great, 😊 Good, 😐 Neutral, 🌧️ Challenging*), calendar views, and `@contact` tagging.
- **File & Document Attachments**: Secure upload and association of documents, images, and PDFs (up to 15MB) with contact profiles.
- **vCard (.vcf) & CSV Import/Export**: Easy two-way bulk contact synchronization with support for vCard 3.0/4.0 and CSV.

### 🛡️ Enterprise-Grade Security & Authentication
- **Multi-Tenant Vault Isolation**: Data is partitioned by Vault ID, enforcing strict tenant separation at the database query level.
- **Approval-Gated Registration**: New account signups can be gated for administrator review and domain whitelisting.
- **Hardware Passkeys (WebAuthn / FIDO2)**: Biometric authentication with Touch ID, Face ID, Windows Hello, and YubiKeys.
- **AES-256-GCM Encrypted TOTP 2FA**: Two-factor authenticator support with symmetric encryption at rest.
- **Active Session & Device Management**: Live list of active sessions with remote revocation and *"Sign out all other devices"*.
- **Immutable Audit Logging**: Automatic recording of authentication attempts, role updates, user approvals, and vault mutations.

### 🤖 Autonomous Agent Engineering Architecture
- Built with **14+ standardized engineering skills** located in `.agents/skills/` following the `addyosmani/agent-skills` specification.
- Contextual memory stores in `.agents/memory/` preserving architectural decisions, domain models, and security rules.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router + Turbopack) | Server Components, Server Actions, Dynamic Layouts |
| **Frontend** | [React 19](https://react.dev/) & [Tailwind CSS v4](https://tailwindcss.com/) | Dark-mode-first, accessible, responsive interface |
| **Database & ORM** | [Prisma ORM](https://www.prisma.io/) (SQLite / PostgreSQL) | Strongly-typed queries and automated schema migrations |
| **Authentication** | [Auth.js v5](https://authjs.dev/) (`next-auth@beta`) | Credentials, Google OAuth 2.0, WebAuthn Passkeys |
| **Cryptography** | Node.js `crypto` & `otplib` | AES-256-GCM TOTP encryption, SHA-256 token hashing |
| **Type Safety** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end strict type verification |

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- **Node.js**: `v18.18.0` or higher
- **npm**, **pnpm**, or **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/MubashirLahori97/Monica-Next-CRM.git
cd Monica-Next-CRM
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env
```

Review `.env` and configure keys as needed:
```env
DATABASE_URL="file:./dev.db"
AUTH_URL="http://localhost:3000"
AUTH_SECRET="super_secret_dev_only_12345"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super_secret_dev_only_12345"
DATA_ENCRYPTION_KEY="l8wW+NPBxTSxfcY2blhSFlJ0Hwu+fJyFI0kKwBLImk0="
ALLOWED_EMAIL_DOMAINS="tkxel.com,gmail.com"

# Initial Super Admin Bootstrap Credentials
INITIAL_SUPER_ADMIN_EMAIL="admin@tkxel.com"
INITIAL_SUPER_ADMIN_PASSWORD="Admin12345678!"
INITIAL_SUPER_ADMIN_NAME="Super Administrator"

# Google OAuth Config (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 4. Initialize Database & Seed
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 5. Start Development Server
```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Default Credentials

The seed script initializes a default administrative account:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@tkxel.com` | `Admin12345678!` | Full System & User Administration |
| **Backup Admin** | `superadmin@tkxel.com` | `Admin12345678!` | Full System & User Administration |

> **Important**: Change these default passwords immediately after your first login in production environments.

---

## 🏛️ Architecture & Directory Structure

```text
Monica-Next-CRM/
├── .agents/                      # AI Agent ecosystem (Skills, Memory, Rules)
│   ├── memory/                   # Architectural decisions & domain models
│   ├── rules/                    # Guardrails & development constraints
│   └── skills/                   # Standardized engineering skills
├── prisma/
│   ├── schema.prisma             # Relational data schema
│   └── seed.ts                   # Database bootstrapping script
├── public/                       # Static media and file assets
├── src/
│   ├── actions/                  # Next.js Server Actions (Contact, Security, Admin, IO)
│   ├── app/                      # Next.js App Router (Pages, Layouts, API routes)
│   │   ├── (app)/                # Protected CRM workspace (Contacts, Diary, Vaults)
│   │   ├── (auth)/               # Authentication flows (Sign in, Sign up, 2FA, Passkeys)
│   │   └── api/                  # Route handlers & WebAuthn endpoints
│   ├── components/               # React UI components
│   │   ├── admin/                # User approval & audit log tables
│   │   ├── crm/                  # Timelines, Graphs, Milestones, Importers, Diary
│   │   ├── layout/               # Sidebar, Header, Navigation
│   │   ├── security/             # Sessions, Passkeys, 2FA cards
│   │   └── ui/                   # CommandPalette, Modals, Buttons
│   ├── lib/                      # Utilities (Auth, Crypto, DB, Permissions, Audit)
│   └── types/                    # TypeScript interfaces & types
├── .env.example                  # Template configuration file
├── Dockerfile                    # Containerization specification
├── docker-compose.yml            # Multi-container orchestration
└── package.json                  # Dependencies & scripts
```

---

## 🔒 Security & Guardrails

- **Input Validation**: Every Server Action validates inputs with strict [Zod](https://zod.dev/) schemas before processing.
- **Tenant Scoping**: All queries require an active `vaultId` check matching the session's membership.
- **Zero Sensitive Leaks**: Passwords, TOTP secrets, and session hashes are never returned to client components.
- **Audit Trails**: Security-relevant actions emit immutable records into the `AuditLog` table.

---

## 📜 Available Scripts

- `npm run dev` — Starts the development server with Turbopack on `http://localhost:3000`.
- `npm run build` — Compiles and builds the application for production.
- `npm run start` — Runs the compiled Next.js production server.
- `npm run lint` — Runs ESLint checks across the codebase.
- `npx prisma studio` — Launches the Prisma database GUI.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
