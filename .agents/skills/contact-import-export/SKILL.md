---
name: contact-import-export
description: Guides agents through standards-compliant vCard (VCF 3.0/4.0) and CSV contact export and import flows across vaults.
---

# Contact Import / Export Architecture

## Overview
Provides bulk data portability for users, allowing migration to and from Apple Contacts, Google Contacts, Microsoft Outlook, and other CRM tools via standardized `.vcf` (vCard) and `.csv` formats.

## Export Standards
1. **vCard 3.0 / 4.0 Format**:
   - `BEGIN:VCARD`
   - `VERSION:3.0`
   - `FN:{firstName} {lastName}`
   - `N:{lastName};{firstName};;;`
   - `EMAIL;TYPE=INTERNET:{email}`
   - `TEL;TYPE=CELL:{phone}`
   - `TITLE:{title}`
   - `ORG:{companyName}`
   - `END:VCARD`
2. **CSV Format**:
   - Headers: `First Name,Last Name,Email,Phone,Job Title,Company,Lifecycle Status`

## Import Pipeline
1. **Parser**: Parse raw text/file into normalized contact objects.
2. **Vault Scoping**: Require valid `vaultId` with user access verification.
3. **Batch Insertion**: Insert contacts within transaction and log audit trail.
4. **Error Handling**: Gracefully report count of successful imports vs skipped rows.
