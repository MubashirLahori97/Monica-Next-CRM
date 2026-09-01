# Architecture Decision Records (ADR Log)

## ADR-001: Separation of Server Actions from Route Segments
- **Status**: Accepted
- **Context**: In Next.js 16 App Router, putting server actions inside `src/app/actions` couples mutations with routing segments and creates routing confusion.
- **Decision**: All server actions are centralized under `src/actions/*.actions.ts`.
- **Consequences**: Cleaner imports (`@/actions/*`), distinct separation between data mutation and UI routes.

## ADR-002: Private-by-Default Multi-Tenant Vault Boundary
- **Status**: Accepted
- **Context**: Personal and team CRM records must be compartmentalized so users only see contacts they have explicit permission to access.
- **Decision**: Every CRM entity (contacts, notes, tasks, reminders, diary entries) is scoped by `vaultId`. Membership is managed via `VaultMembership`. Super Admins (rank 1) have global supervisory visibility.
- **Consequences**: Strict multi-tenant isolation; authorization checks are enforced on every server action and query.

## ADR-003: Approval Gate & Multi-Tier Authentication
- **Status**: Accepted
- **Context**: Enterprise CRM requires domain validation, email proofing, admin approval, and mandatory 2FA.
- **Decision**: Four-tier gate: (1) Domain Whitelist -> (2) Email Token Verification -> (3) Super Admin Approval -> (4) TOTP 2FA / WebAuthn Passkey.
- **Consequences**: Zero unauthorized workspace access; rogue accounts cannot view CRM records even if credentials are created.

## ADR-004: Centralized Project Customizations & Orchestration
- **Status**: Accepted
- **Context**: Complex development across domain models, security, and UI benefits from multi-agent orchestration and production engineering skills (Addy Osmani agent-skills standard).
- **Decision**: Adopt `.agents/` customization standard with memory store, specialist personas (`orchestrator`, `crm-architect`, `security-auditor`, `frontend-engineer`, `qa-test-engineer`, `database-devops`), and lifecycle engineering skills.
- **Consequences**: Standardized development workflows, persistent memory, and deterministic quality gates.
