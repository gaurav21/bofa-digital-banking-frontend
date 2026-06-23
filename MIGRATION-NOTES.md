# Angular 14 → 18 Migration Notes

## Background

Angular 14 reached **end-of-life on November 18, 2023**. Per BofA InfoSec Policy ISP-2024-0847, all customer-facing applications must run on actively supported framework versions.

**Compliance deadline:** Q2 2025
**Target version:** Angular 18 (LTS)
**Risk level:** HIGH — customer-facing app serving millions of users

---

## Major Breaking Changes

### 1. NgModules → Standalone Components

**Current state:** 47 NgModules across the application
**Required:** Migrate to standalone components, directives, and pipes

All feature modules (`AccountsModule`, `TransfersModule`) and shared component modules (`BofaAccountCardModule`, `BofaTransactionTableModule`, `BofaNavHeaderModule`) must be converted.

```typescript
// BEFORE (Angular 14)
@NgModule({
  declarations: [AccountsDashboardComponent],
  imports: [CommonModule, HttpClientModule, MatProgressSpinnerModule],
})
export class AccountsModule { }

// AFTER (Angular 18)
@Component({
  standalone: true,
  imports: [CommonModule, MatProgressSpinner],
  selector: 'bofa-accounts-dashboard',
  ...
})
export class AccountsDashboardComponent { }
```

### 2. Angular Material: Legacy → MDC

**Angular Material 15+** removed all `MatLegacy*` components. Every `MatLegacy` import must be replaced:

| Angular 14 (Legacy) | Angular 18 (MDC) |
|---------------------|------------------|
| `MatLegacyCardModule` | `MatCard` (standalone) |
| `MatLegacyTableModule` | `MatTable` (standalone) |
| `MatLegacyButtonModule` | `MatButton` (standalone) |
| `MatLegacyFormFieldModule` | `MatFormField` (standalone) |
| `MatLegacyInputModule` | `MatInput` (standalone) |
| `MatLegacySelectModule` | `MatSelect` (standalone) |
| `MatLegacyPaginatorModule` | `MatPaginator` (standalone) |
| `MatLegacyMenuModule` | `MatMenu` (standalone) |
| `MatLegacyTabsModule` | `MatTab` (standalone) |
| `MatLegacyProgressSpinnerModule` | `MatProgressSpinner` (standalone) |

**CSS impact:** MDC components have different DOM structure and CSS classes. All custom BofA Design System overrides must be tested and updated.

### 3. HttpClientModule → provideHttpClient()

```typescript
// BEFORE
imports: [HttpClientModule]

// AFTER
providers: [provideHttpClient(withInterceptorsFromDi())]
```

### 4. RxJS Updates

**Deprecated patterns in our codebase:**

| Pattern | File | Migration |
|---------|------|-----------|
| `shareReplay(1)` (no config) | `accounts.service.ts`, `market-data.provider.ts` | `shareReplay({ bufferSize: 1, refCount: true })` |
| `retry(3)` (count only) | `market-data.provider.ts` | `retry({ count: 3, delay: 1000 })` |
| `catchError` after `shareReplay` | `accounts.service.ts` | Reorder operators |
| `interval()` + `buffer()` pattern | `bofa-analytics.sdk.ts` | Consider `bufferTime()` or signals |

### 5. Router Events

```typescript
// BEFORE (Angular 14)
this.router.events.pipe(
  filter(event => event instanceof NavigationEnd)
)

// AFTER (Angular 18)
this.router.events.pipe(
  filter((event): event is NavigationEnd => event instanceof NavigationEnd)
)
// Or use the new type-safe router events API
```

### 6. Dependency Injection Changes

- `@Inject(PLATFORM_ID)` → Consider using `inject()` function
- `providedIn: 'root'` still works but standalone components change how tree-shaking works
- Constructor injection → `inject()` function preferred in Angular 18

### 7. SSO Service (`sso.service.ts`)

The SSO integration uses Angular 14-specific patterns:
- `BehaviorSubject` state management → Consider Angular Signals
- `HttpClient` via constructor DI → Use `inject(HttpClient)`
- Manual `shareReplay` caching → Signal-based computed state

### 8. Analytics SDK (`bofa-analytics.sdk.ts`)

- `@Inject(PLATFORM_ID)` decorator pattern → `inject(PLATFORM_ID)`
- `Subject` + `buffer(interval())` → `effect()` + batched signal writes
- Manual `ngOnDestroy` → `DestroyRef` + `takeUntilDestroyed()`

---

## Migration Strategy

### Phase 1: Infrastructure (Week 1-2)
- [ ] Update `angular.json` and `tsconfig.json`
- [ ] Update all `@angular/*` packages to v18
- [ ] Update `@angular/material` to v18
- [ ] Fix TypeScript compilation errors

### Phase 2: Material Migration (Week 3-4)
- [ ] Replace all `MatLegacy*` imports with MDC equivalents
- [ ] Convert Material modules to standalone imports
- [ ] Test and fix all CSS/design system overrides

### Phase 3: Component Migration (Week 5-6)
- [ ] Convert shared components to standalone (`bofa-account-card`, `bofa-transaction-table`, `bofa-nav-header`)
- [ ] Convert feature modules to standalone (`AccountsModule`, `TransfersModule`)
- [ ] Replace `HttpClientModule` with `provideHttpClient()`

### Phase 4: Services & Providers (Week 7-8)
- [ ] Refactor `SsoAuthService` for Angular 18 patterns
- [ ] Update `BofAAnalyticsService` — replace deprecated RxJS patterns
- [ ] Update `MarketDataProvider` — fix retry/shareReplay patterns
- [ ] Migrate to `inject()` function where beneficial

### Phase 5: Testing & Validation (Week 9-10)
- [ ] Run full regression suite
- [ ] Performance benchmarking (bundle size, LCP, TTI)
- [ ] Security review of auth flow changes
- [ ] Coordinate with 12 downstream teams on shared component changes

---

## Risks

1. **Shared Component Library** — 12 downstream teams consume our components. Breaking changes require coordinated release.
2. **SSO Integration** — Auth flow changes could cause login failures for millions of users.
3. **Analytics SDK** — Proprietary SDK uses Angular internals that may break.
4. **CSS Regression** — MDC components have different DOM; BofA Design System overrides may break.
5. **Bundle Size** — Tree-shaking changes may affect load performance.

## Estimated Effort

- **Engineering:** 10 weeks (2 senior engineers)
- **QA:** 3 weeks regression testing
- **Security Review:** 1 week
- **Staged Rollout:** 2 weeks (canary → 10% → 50% → 100%)
