# Bank of America — Digital Banking Platform

## Overview

This is the **customer-facing digital banking frontend** powering Bank of America's retail banking experience. Built on Angular 14.1 with Angular Material 14, this application serves **millions of retail banking customers** across web and mobile-web channels.

## Architecture

- **Framework:** Angular 14.1.3 (TypeScript 4.7)
- **UI Library:** Angular Material 14 (with custom BofA Design System overlay)
- **State Management:** RxJS 7.5 + NgRx (select modules)
- **Auth:** Internal SSO/MFA via BofA Identity Platform (OAuth 2.0 + PKCE)
- **Analytics:** Proprietary BofA Analytics SDK (`@bofa/analytics-sdk`)
- **API Gateway:** Internal GraphQL + REST hybrid (BofA API Platform)
- **Build:** Angular CLI 14.1, Webpack 5

## Shared Component Library

This application is built on the **BofA Shared UI Component Library** (`@bofa/shared-components`), which is consumed by **12+ downstream teams** across:
- Consumer Banking Portal (this app)
- Small Business Banking
- Wealth Management Dashboard
- Credit Card Services
- Mortgage Origination Portal

Any breaking changes to shared components require coordination across all consuming teams.

## Key Integrations

| System | Purpose | Protocol |
|--------|---------|----------|
| BofA Identity Platform | SSO/MFA Authentication | OAuth 2.0 + PKCE |
| BofA Analytics SDK | User behavior tracking, funnel analysis | Proprietary JS SDK |
| Market Data Service | Real-time quotes, account valuations | WebSocket + REST |
| Core Banking API | Account data, transactions, transfers | REST (internal) |
| Notification Service | Push notifications, alerts | Server-Sent Events |

## ⚠️ CRITICAL: Angular 14 End-of-Life Migration

**Angular 14 reaches end-of-life on November 18, 2023.** Per BofA InfoSec Policy ISP-2024-0847, all customer-facing applications must run on supported framework versions. **Compliance deadline: Q2 2025.**

### Migration Target: Angular 18

This migration is non-trivial due to:
1. **NgModule → Standalone Components** — All 47 modules must be migrated
2. **MatLegacy → Mat** — Angular Material legacy components removed in v16+
3. **RxJS API changes** — Deprecated operators and patterns
4. **SSO Service rewrite** — Uses Angular 14-specific injection patterns
5. **Analytics SDK compatibility** — Proprietary SDK uses internal Angular APIs
6. **Downstream component library** — 12 teams depend on our shared components

See `MIGRATION-NOTES.md` for detailed migration plan.

## Development

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200/`.

## Build

```bash
ng build --configuration production
```

## Testing

```bash
ng test          # Unit tests (Karma + Jasmine)
ng e2e           # E2E tests (Cypress)
```

## Team

- **Squad:** Digital Banking — Consumer Experience
- **Tech Lead:** (internal)
- **Product Owner:** (internal)
- **On-call rotation:** PagerDuty — `digital-banking-frontend`
