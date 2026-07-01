---
name: testing-bofa-frontend
description: Test the BofA digital banking frontend end-to-end. Use when verifying Angular migration, Material component rendering, or route navigation.
---

# Testing BofA Digital Banking Frontend

## Dev Server Setup

```bash
cd /home/ubuntu/repos/bofa-digital-banking-frontend
npm install   # if not already done
npx ng serve --host 0.0.0.0 --port 4200
```

The server compiles and serves at `http://localhost:4200`. Expect webpack warnings about unused TypeScript files (sso.service.ts, auth.guard.ts, market-data.provider.ts, bofa-nav-header.component.ts, shared/index.ts) — these are informational, not errors.

## Routes to Test

| Route | Expected Content |
|---|---|
| `/` or `/after-login` | Flexbox demo layout (Angular logo, "This is flexbox example using tailwind"), AfterLoginComponent text, Material datepicker with "Choose a date" label, footer |
| `/before-login` | Text: "before-login works!" |
| `/accounts` | "Your Accounts" heading, "Account overview as of [date]" subtitle, Total Balance card, transaction table with filter field + column headers (Date, Description, Category, Amount, Status) + paginator |
| `/transfers` | "Transfer Funds" heading, form with From Account (select), To Account (select), Amount (number input with $ prefix), Memo (text input), Transfer button (disabled when form invalid), Cancel button |

## Key Material Components to Verify

- **Datepicker** (after-login page): Click calendar icon → calendar popup opens → select date → input fills
- **Form fields** (transfers page): Outline appearance, floating labels on focus, input accepts text
- **Table** (accounts page): Column headers render, paginator shows "Items per page" dropdown
- **Select dropdowns** (transfers page): mat-select renders with dropdown arrow

## Known Limitations

- **No backend API**: The app calls `yourapiendpointhere.../accounts/overview` etc. These will fail with `ERR_NAME_NOT_RESOLVED`. The AccountsService has a `catchError` that returns empty data (`totalBalance: 0, accounts: [], recentTransactions: []`), so the accounts page renders but with no data.
- **GitHub CDN images**: The Angular logo image in the sidebar loads from `repository-images.githubusercontent.com` — this may fail depending on network access from the test VM.
- **Analytics endpoint**: `[BofA Analytics] Batch flush failed` warnings are expected — no analytics backend.

## Console Error Interpretation

**Expected errors** (not migration-related):
- `Failed to load resource: yourapiendpointhere...` — no backend
- `Failed to load resource: repository-images.githubusercontent.com...` — CDN not reachable
- `[BofA Analytics] Batch flush failed` — no analytics endpoint

**Migration errors to watch for** (would indicate broken migration):
- `NullInjectorError` — missing provider in standalone bootstrap
- `NG0304` — component not found (broken standalone imports)
- `Error: Uncaught (in promise)` from chunk loading — lazy route broken
- `NG0303` — directive not found

## Build & Lint Commands

```bash
npx ng build --configuration production  # production build
npx ng test                               # Jest tests (7 test suites)
npx ng lint                               # ESLint
```

## Devin Secrets Needed

None required for local testing. The app runs entirely client-side with no backend dependencies.
