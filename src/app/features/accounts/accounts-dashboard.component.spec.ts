import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AccountsDashboardComponent } from './accounts-dashboard.component';
import { AccountsService } from './accounts.service';
import { BofAAnalyticsService } from '../../core/analytics/bofa-analytics.sdk';

describe('AccountsDashboardComponent', () => {
  let fixture: ComponentFixture<AccountsDashboardComponent>;
  let component: AccountsDashboardComponent;
  const accountsService = {
    getAccountOverview: jest.fn(),
  };
  const analyticsService = {
    trackEvent: jest.fn(),
  };

  beforeEach(() => {
    accountsService.getAccountOverview.mockReturnValue(
      of({
        totalBalance: 321,
        accounts: [
          {
            accountId: 'acct-1',
            accountType: 'checking',
            accountName: 'Primary Checking',
            maskedNumber: '1234',
            balance: 321,
            availableBalance: 300,
            currency: 'USD',
          },
        ],
        recentTransactions: [],
      })
    );

    TestBed.configureTestingModule({
      declarations: [AccountsDashboardComponent],
      providers: [
        { provide: AccountsService, useValue: accountsService },
        { provide: BofAAnalyticsService, useValue: analyticsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(AccountsDashboardComponent);
    component = fixture.componentInstance;
  });

  it('loads the overview on init', () => {
    component.ngOnInit();

    expect(accountsService.getAccountOverview).toHaveBeenCalled();
    expect(component.overview?.totalBalance).toBe(321);
    expect(component.isLoading).toBe(false);
    expect(analyticsService.trackEvent).toHaveBeenCalledWith('accounts_dashboard_viewed');
  });

  it('tracks view and transfer interactions', () => {
    component.viewAccountDetails({ accountId: 'acct-1', accountType: 'checking' });
    component.initiateTransfer({ accountId: 'acct-1' });

    expect(component.selectedAccountId).toBe('acct-1');
    expect(analyticsService.trackEvent).toHaveBeenCalledWith('account_details_clicked', { accountType: 'checking' });
    expect(analyticsService.trackEvent).toHaveBeenCalledWith('transfer_initiated', { fromAccount: 'acct-1' });
  });

  it('clears loading when the overview request fails', () => {
    accountsService.getAccountOverview.mockReturnValueOnce(throwError(() => new Error('boom')));

    component.ngOnInit();

    expect(component.isLoading).toBe(false);
  });
});
