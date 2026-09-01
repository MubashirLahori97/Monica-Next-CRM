---
name: code-review-and-quality
description: 5-axis code quality review and static analysis verification before finalizing changes.
---

# Code Review & Quality

## The 5 Review Axes
1. **Correctness & Logic**: Does the code fulfill requirements without edge-case regressions?
2. **Security & Permissions**: Are input schemas validated? Is vault boundary authorization enforced?
3. **Performance & Efficiency**: Are database queries optimized? Are unneeded re-renders avoided?
4. **Maintainability & Readability**: Are types explicit? Are symbols cleanly named?
5. **Zero Linter Warnings**: Do `npm run lint` and `npx tsc --noEmit` exit cleanly with 0 warnings/errors?
