---
name: database-migration-seed
description: >-
  Guides PostgreSQL database setup, Prisma schema evolution, migration generation,
  and secure environment-based bootstrapping of Super Admin and role permissions.
---

# Database Migration & Seeding Procedures

This skill provides step-by-step guidance for managing the database lifecycle, migrating from SQLite to PostgreSQL, and executing secure seeds.

## Workflow Procedures

### 1. PostgreSQL Database Configuration
- Ensure Docker PostgreSQL container is running:
  ```powershell
  docker compose up -d postgres
  ```
- Update `prisma/schema.prisma` datasource provider to `postgresql`:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
- Configure `.env` with the PostgreSQL connection string:
  ```env
  DATABASE_URL="postgresql://monica:monica_secure_password@localhost:5432/monica_crm?schema=public"
  ```

### 2. Windows Node Process & Prisma Engine Unlock
When `npx prisma generate` fails on Windows due to file locking on `query_engine-windows.dll.node`:
1. Stop running `next dev` processes:
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```
2. Run Prisma generator:
   ```powershell
   npx prisma generate
   ```

### 3. Safe Schema Migrations
- Create and apply named migrations rather than destructive pushes:
  ```powershell
  npx prisma migrate dev --name init_postgresql_schema
  ```
- In CI / production deployment, execute:
  ```powershell
  npx prisma migrate deploy
  ```

### 4. Idempotent & Secure Seed Script
- Seeds MUST read Super Admin credentials from environment variables:
  - `INITIAL_SUPER_ADMIN_EMAIL`
  - `INITIAL_SUPER_ADMIN_PASSWORD`
- Seed sequence:
  1. Create default Roles & Permissions (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `USER`).
  2. Create or verify initial Super Admin user with status `active` and 2FA pending flag.
  3. Create initial Default Vault and assign Super Admin as owner/member.
  4. Never hardcode weak demo passwords into version control.
