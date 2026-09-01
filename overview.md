## 📖 Project Overview

**Monica Next CRM** is a secure, modern relationship management platform designed for individuals and collaborative teams. It provides a centralized environment for managing personal and professional relationships, tracking interactions, organizing important life events, maintaining personal journals, and securely storing sensitive information.

Built with privacy and security as core principles, Monica Next CRM combines powerful relationship management capabilities with enterprise-grade access control. All user data is organized within isolated **Vaults**, ensuring clear data ownership and controlled access for individuals and teams.

### 🌟 Key Highlights

#### 🔐 Privacy-First Multi-Tenancy

All application data—including contacts, notes, tasks, diary entries, and attachments—is stored within isolated **Vaults**. Access is strictly controlled through role-based permissions:

- **Owner** — Full administrative control over the Vault
- **Editor** — Can create, update, and manage Vault content
- **Viewer** — Read-only access to authorized information

This architecture ensures strong data isolation and prevents unauthorized access between users and teams.

#### 🛡️ Enterprise-Grade Security

Monica Next CRM includes multiple layers of authentication, authorization, and security controls, including:

- Auth.js v5 authentication
- Approval-based user registration
- Corporate domain enforcement
- AES-256-GCM encrypted TOTP two-factor authentication
- WebAuthn Passkey support
- Active session management and revocation
- Immutable audit logging

These features provide a secure foundation for managing sensitive personal and organizational relationship data.

#### 👥 Comprehensive Relationship Management

The platform provides a rich set of tools for organizing and understanding relationships, including:

- Global Command Palette (`Cmd + K`) for quick navigation and actions
- Contact relationship network visualization
- Interactive chronological activity timelines
- Important dates and milestone tracking
- Personal diary with mood and sentiment tracking
- Bulk contact import and export using vCard and CSV formats

#### 🤖 AI-Ready Development Architecture

Monica Next CRM includes a structured AI-assisted development environment with **14+ standardized engineering skills** based on the `addyosmani/agent-skills` specification.

These skills are organized within the `.agents/skills/` directory and supported by centralized memory stores, enabling AI agents and developers to follow consistent engineering practices, maintain project context, and work more effectively across the codebase.