---
name: monica-diary-journal
description: Guides agents through modeling, querying, creating, and filtering rich chronological diary and journal entries with sentiment/mood tracking and contact tagging within vault boundaries.
---

# Monica CRM Diary & Journal Architecture

## Overview
The Diary & Journal system provides users with private, vault-scoped reflection and chronological logging. It enables daily mood/sentiment tracking (*Great, Good, Neutral, Difficult*), rich text logging, and contact associations.

## Data Model & Constraints
- **Model**: `DiaryEntry`
  - `id`: UUID primary key
  - `vaultId`: Foreign key to `Vault` (enforces multi-tenant authorization)
  - `authorUserId`: User who wrote the entry
  - `title`: Optional headline/subject
  - `body`: Rich markdown or text content
  - `entryDate`: Date of the journal entry (default: today)
  - `mood`: Optional sentiment string (`great`, `good`, `neutral`, `bad`)
  - `contactId`: Optional primary contact referenced

## UI / UX Architecture
1. **Date Navigator & Feed**: Chronological list of entries with month/year grouping and day badges.
2. **Mood Tracker**: Emoji-driven mood selector with visual indicators.
3. **Contact Tagging / Filter**: Filter entries by associated contact or vault.
4. **Interactive Composer**: Fast client-side composer for instant journaling with optimistic feedback.
