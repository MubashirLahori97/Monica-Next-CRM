---
name: milestones-and-important-dates
description: Guides agents through modeling, calculating countdowns, and managing recurring milestones (Birthdays, Anniversaries, Custom Dates) with automatic reminder engine integration.
---

# Important Dates & Milestones Engine

## Overview
Monica CRM personal milestone tracking captures recurring and one-off critical dates (Birthdays, Anniversaries, First Met dates, Work Anniversaries, Memorials).

## Key Milestone Logic
1. **Next Occurrence Calculation**:
   - For yearly recurring milestones (e.g. Birthdays), calculate the next upcoming date from today.
   - Calculate exact age or milestone years (e.g. *"Turning 34"* or *"5th Anniversary"*).
2. **Countdown Badges**:
   - `Today` (highlighted in emerald/gold)
   - `In X days` (urgent countdown if < 14 days)
   - `Next month` / `In X months`
3. **Automated Reminders**:
   - Create or sync scheduled `Reminder` records with `recurrence: 'yearly'` linked to `Contact` and `Vault`.
4. **Verification**:
   - Strict lint, TypeScript, and Next.js production build validation.
