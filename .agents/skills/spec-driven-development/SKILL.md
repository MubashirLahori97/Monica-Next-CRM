---
name: spec-driven-development
description: Guides agents through creating clear technical specifications, user stories, and acceptance criteria before writing code.
---

# Spec-Driven Development

## Overview
Spec-Driven Development enforces writing unambiguous feature specifications and acceptance criteria before implementation begins.

## When to Use
- Starting any new CRM feature (e.g. Relationship Graph, Command Palette, Activity Timeline).
- Major schema extensions or API contracts.

## Process
1. **Clarify Requirements**: Identify user goals, edge cases, and security boundaries.
2. **Define Data Contracts**: Specify TypeScript types, Prisma model changes, and Server Action input/output schemas.
3. **Establish Acceptance Criteria**: Formulate testable assertions (Given-When-Then).
4. **Obtain Alignment**: Document in project memory before code generation.
