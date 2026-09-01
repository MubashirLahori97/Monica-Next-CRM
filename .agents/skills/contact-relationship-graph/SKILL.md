---
name: contact-relationship-graph
description: Guides agents through modeling, querying, and rendering visual relationship graphs and organizational/family trees between contacts within vault boundaries.
---

# Contact Relationship Graph & Network Mapping

## Overview
Guides the creation of reciprocal and directional relationship maps between contacts (Family, Professional, Social) in the Monica CRM architecture, ensuring strict multi-tenant vault boundaries and responsive interactive UI rendering.

## Relationship Types & Semantics
1. **Family**:
   - `Spouse` / `Partner` (Symmetric)
   - `Parent` / `Child` (Hierarchical inverse)
   - `Sibling` (Symmetric)
2. **Professional**:
   - `Manager` / `Direct Report` (Hierarchical inverse)
   - `Colleague` / `Coworker` (Symmetric)
   - `Client` / `Vendor`
3. **Social & Introductions**:
   - `Friend` / `Acquaintance`
   - `Introduced By` / `Introduced`

## Process
1. **Data Querying**: Query direct relationships (`contactId -> relatedContactId`) and inverse relationships (`relatedContactId -> contactId`) within the same `vaultId`.
2. **Graph Model Construction**: Structure into categorized connection clusters (Family, Work, Social) with connection badges and direction indicator.
3. **Interactive UI Rendering**: Render connected visual nodes with contact initials, job title, connection pills, and quick-jump links.
4. **Verification**: Run static checks (`npm run lint`, `npx tsc --noEmit`) and full Next.js build (`npm run build`).
