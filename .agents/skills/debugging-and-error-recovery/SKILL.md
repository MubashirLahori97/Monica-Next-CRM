---
name: debugging-and-error-recovery
description: Guides agents through systematic root-cause analysis and deterministic bug resolution.
---

# Debugging & Error Recovery

## Process
1. **Reproduce**: Identify the exact trigger condition and error stack trace.
2. **Isolate**: Determine whether the defect stems from the database layer, server action, or client component.
3. **Formulate Hypothesis**: Pinpoint the underlying flaw (e.g. race condition, missing vault check, type mismatch).
4. **Fix & Verify**: Apply the minimal direct fix and verify with typecheck and linting.
