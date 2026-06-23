import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountsService, AccountOverview } from './accounts.service';
import { BofAAnalyticsService } from '../../core/analytics/bofa-analytics.sdk';

@Component({
  selector: 'bofa-accounts-dashboard',
  template: `
    <div class="accounts-dashboard">
      <h1 class="dashboard-title">Your Accounts</h1>
      <p class="dashboard-subtitle">Account overview as of {{ lastUpdated | date:'medium' }}</p>

      <div class="accounts-grid" *ngIf="overview">
        <div class="total-balance-card">
          <h2>Total Balance</h2>
          <span class="total-amount">{{ overview.totalBalance | currency:'USD' }}</span>
        </div>

        <bofa-account-card
          *ngFor="let account of overview.accounts"
          [account]="account"
          [selected]="selectedAccountId === account.accountId"
          (onViewDetails)="viewAccountDetails($event)"
          (onTransfer)="initiateTransfer($event)">
        </bofa-account-card>
      </div>

      <div class="recent-activity" *ngIf="overview">
        <h2>Recent Activity</h2>
        <bofa-transaction-table [transactions]="overview.recentTransactions">
        </bofa-transaction-table>
      </div>

      <mat-spinner *ngIf="isLoading" diameter="48"></mat-spinner>
    </div>
  `,
  styles: [`
    .accounts-dashboard { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .dashboard-title { color: #012169; margin-bottom: 4px; }
    .dashboard-subtitle { color: #666; margin-bottom: 24px; }
    .total-balance-card { background: #012169; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
    .total-amount { font-size: 2rem; font-weight: 700; }
    .accounts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px; }
    .recent-activity { margin-top: 32px; }
  `]
})
export class AccountsDashboardComponent implements OnInit, OnDestroy {
  overview: AccountOverview | null = null;
  isLoading = true;
  selectedAccountId: string | null = null;
  lastUpdated = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private accountsService: AccountsService,
    private analytics: BofAAnalyticsService
  ) {}

  ngOnInit(): void {
    this.analytics.trackEvent('accounts_dashboard_viewed');

    this.accountsService.getAccountOverview().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (overview) => {
        this.overview = overview;
        this.isLoading = false;
        this.lastUpdated = new Date();
      },
      error: () => { this.isLoading = false; }
    });
  }

  viewAccountDetails(account: any): void {
    this.selectedAccountId = account.accountId;
    this.analytics.trackEvent('account_details_clicked', { accountType: account.accountType });
  }

  initiateTransfer(account: any): void {
    this.analytics.trackEvent('transfer_initiated', { fromAccount: account.accountId });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
