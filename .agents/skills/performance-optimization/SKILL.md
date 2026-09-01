---
name: performance-optimization
description: Guides agents through query optimization, React 19 server/client boundary tuning, and Next.js Core Web Vitals.
---

# Performance Optimization

## Overview
Guidelines for maximizing runtime speed, database efficiency, and responsive user experience.

## Rules
- **Prisma Selection**: Select only needed fields (`select: { id: true, name: true }`) instead of wide queries.
- **Server Component Strategy**: Fetch data in React Server Components to avoid client waterfall requests.
- **Image Optimization**: Use Next.js `<Image />` component with proper dimensioning.
- **Caching**: Use React `cache()` for deduplicating request-scoped database reads.
