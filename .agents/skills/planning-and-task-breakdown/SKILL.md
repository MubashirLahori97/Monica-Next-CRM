---
name: planning-and-task-breakdown
description: Guides agents through breaking complex software features into atomic, dependency-ordered tasks with verification criteria.
---

# Planning & Task Breakdown

## Overview
Deconstructs large user requests into discrete, verifiable milestones to avoid regressions and unmanageable diffs.

## When to Use
- Implementing multi-file features spanning Database, Server Actions, and UI components.
- Refactoring existing architectures or dependencies.

## Process
1. **Analyze Dependencies**: Map out base dependencies (Schema -> Actions -> UI Components -> Routes).
2. **Order Tasks Logically**: Ensure foundational layers exist before dependent components are coded.
3. **Attach Checkpoints**: Every task must have a verification command (`npm run lint`, `npx tsc --noEmit`).
