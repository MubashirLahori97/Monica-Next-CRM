---
name: monica-crm-domain-models
description: >-
  Provides implementation workflows, schema patterns, and UI specifications for Monica-style CRM features:
  Contacts, Relationships, Notes, Tasks, Reminders, Diary entries, Labels, and Attachments.
---

# Monica CRM Domain Models & Feature Architecture

This skill guides the implementation of personal and team relationship management features inspired by Monica, built cleanly with Next.js 16, TypeScript, and Prisma.

## Feature Domains & Data Relationships

### 1. Vaults (Private-by-Default Multi-Tenancy)
- Every CRM record (Contacts, Notes, Tasks, Reminders, Diary, Attachments) belongs to a `Vault`.
- Users access records through explicit `VaultMember` assignments.
- Vault switching is persisted in the UI / session state.

### 2. Contacts & Contact Relationships
- **Contact**: Name, nickname, avatar, email, phone, address, birthday, gender, occupation, notes, favorite flag.
- **Relationships**: Graph connecting two contacts with a relationship type (e.g. `Spouse`, `Child`, `Parent`, `Colleague`, `Friend`, `Manager`, `Report`).
  - Bidirectional mapping (e.g. `Contact A -> is parent of -> Contact B`).

### 3. Notes & Interactions / Activities
- **Notes**: Rich-text / markdown notes associated with a contact or vault.
- **Activities/Interactions**: Logged meetings, phone calls, lunches, with date, participants, summary, and activity type.

### 4. Tasks & Reminders
- **Tasks**: To-do items linked to a contact or general vault task, with due dates, assignees, and completion state.
- **Reminders**: Specific notification triggers (e.g. "Call Alice next week", "Annual Birthday Reminder"), recurrence patterns (yearly, monthly, weekly, custom).

### 5. Personal Diary & Journaling
- **Diary Entries**: Date-based reflection entries with mood, tags, and rich content scoped to a vault.

### 6. Labels & Tagging
- Custom color-coded labels applied across contacts for grouping and filtering.

### 7. File Attachments
- Secure documents or photos attached to contacts, notes, or diary entries.
- Stored on disk or cloud storage with verified file-type checks and vault-scoped access tokens.
