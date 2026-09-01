---
name: incremental-implementation
description: Guides agents through safe, small-step code changes with continuous validation.
---

# Incremental Implementation

## Overview
Executes code changes in small, self-contained increments, validating after each step to prevent cascading breakage.

## When to Use
- All coding tasks, refactoring, and file modifications.

## Process
1. **Implement Single Component/Action**: Make focused edits to target files.
2. **Verify Immediately**: Run typecheck and linting after every change.
3. **Commit/Advance**: Proceed to the next incremental step only after verification succeeds.
