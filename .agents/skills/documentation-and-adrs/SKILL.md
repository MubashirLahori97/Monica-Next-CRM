---
name: documentation-and-adrs
description: Guides agents through recording architectural decisions, maintaining project memory, and updating documentation.
---

# Documentation & ADRs

## Overview
Maintains project memory integrity by documenting structural decisions, model changes, and API contracts.

## Process
1. **Identify Decision**: When introducing a new pattern, library, or security policy.
2. **Draft ADR in Memory**: Record in `.agents/memory/DECISION_LOG.md` with Status, Context, Decision, and Consequences.
3. **Update Memory Store**: Keep `.agents/memory/SYSTEM_OVERVIEW.md` and `DOMAIN_MODELS.md` synchronized.
