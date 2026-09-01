---
name: security-and-hardening
description: Guides agents through OWASP defenses, cryptographic security, authorization validation, and audit logging.
---

# Security & Hardening

## Overview
Ensures all CRM and auth features resist injection, privilege escalation, and data leaks.

## Guardrails
- Validate all incoming arguments with Zod schemas.
- Encrypt sensitive data using AES-256 with distinct IVs.
- Hash passwords with bcrypt (rounds >= 12).
- Require vault membership verification on every resource mutation and access.
- Record every critical change to the immutable `AuditLog`.
