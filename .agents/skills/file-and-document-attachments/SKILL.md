---
name: file-and-document-attachments
description: Guides agents through secure file upload, MIME type & size validation, storage key management, and attachment listing/deletion for contacts and vaults.
---

# File & Document Attachments Architecture

## Overview
Allows users to securely attach documents, PDFs, contracts, ID copies, and images to contacts and vaults within the Monica CRM system.

## Data Model & Constraints
- **Model**: `Attachment`
  - `id`: UUID primary key
  - `vaultId`: Foreign key to `Vault`
  - `contactId`: Optional foreign key to `Contact`
  - `uploadedByUserId`: Foreign key to `User`
  - `fileName`: Original file name
  - `contentType`: MIME type (e.g. `application/pdf`, `image/png`, `text/plain`)
  - `sizeBytes`: File size in bytes
  - `storageKey`: Unique storage identifier / path
  - `createdAt`: Upload timestamp

## Security & Validation Rules
1. **Size Limits**: Max 15MB per attachment.
2. **MIME Whitelist**: `image/*`, `application/pdf`, `text/*`, `application/zip`, `application/vnd.*`, `application/msword`.
3. **Vault Authorization**: Always verify membership in `vaultId` before query, upload, or deletion.
4. **Audit Trail**: Record `attachment.uploaded` and `attachment.deleted` events.
