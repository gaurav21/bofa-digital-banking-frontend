import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TransferFormComponent } from './transfer-form.component';
import { TransfersService } from './transfers.service';
import { AccountsService } from '../accounts/accounts.service';
import { BofAAnalyticsService } from '../../core/analytics/bofa-analytics.sdk';

describe('TransferFormComponent', () => {
  let fixture: ComponentFixture<TransferFormComponent>;
  let component: TransferFormComponent;
  const transfersService = {
    submitTransfer: jest.fn(),
  };
  const accountsService = {
    getAccountOverview: jest.fn(),
    invalidateCache: jest.fn(),
  };
  const analyticsService = {
    trackFunnelStep: jest.fn(),
    trackTransaction: jest.fn(),
  };

  beforeEach(() => {
    transfersService.submitTransfer.mockReturnValue(
      of({
        confirmationNumber: 'CONF-1',
        status: 'completed',
        timestamp: new Date().toISOString(),
      })
    );
    accountsService.getAccountOverview.mockReturnValue(
      of({
        totalBalance: 100,
        accounts: [
          {
            accountId: 'acct-1',
            accountType: 'checking',
            accountName: 'Primary Checking',
            maskedNumber: '1234',
            balance: 100,
            availableBalance: 100,
            currency: 'USD',
          },
        ],
        recentTransactions: [],
      })
    );

    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
      ],
      declarations: [TransferFormComponent],
      providers: [
        { provide: TransfersService, useValue: transfersService },
        { provide: AccountsService, useValue: accountsService },
        { provide: BofAAnalyticsService, useValue: analyticsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(TransferFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts invalid and validates amount boundaries', () => {
    expect(component.transferForm.valid).toBe(false);

    component.transferForm.patchValue({
      fromAccountId: 'acct-1',
      toAccountId: 'acct-2',
      amount: 0,
    });
    expect(component.transferForm.get('amount')?.valid).toBe(false);

    component.transferForm.patchValue({ amount: -1 });
    expect(component.transferForm.get('amount')?.valid).toBe(false);

    component.transferForm.patchValue({ amount: 0.01 });
    expect(component.transferForm.get('amount')?.valid).toBe(true);

    component.transferForm.patchValue({
      fromAccountId: 'acct-1',
      toAccountId: 'acct-2',
      amount: 25.5,
      memo: 'Rent',
    });
    expect(component.transferForm.valid).toBe(true);
  });

  it('does nothing when submitted with an invalid form', () => {
    component.onSubmit();

    expect(transfersService.submitTransfer).not.toHaveBeenCalled();
    expect(analyticsService.trackTransaction).not.toHaveBeenCalled();
    expect(component.isSubmitting).toBe(false);
  });

  it('marks success, tracks analytics, and invalidates the cache on success', () => {
    component.transferForm.setValue({
      fromAccountId: 'acct-1',
      toAccountId: 'acct-2',
      amount: 25,
      memo: 'Rent',
    });

    const result$ = new Subject<any>();
    transfersService.submitTransfer.mockReturnValueOnce(result$.asObservable());
    component.onSubmit();

    expect(component.isSubmitting).toBe(true);
    expect(analyticsService.trackFunnelStep).toHaveBeenCalledWith('fund_transfer', 2, 'form_submitted');
    expect(transfersService.submitTransfer).toHaveBeenCalledWith({
      fromAccountId: 'acct-1',
      toAccountId: 'acct-2',
      amount: 25,
      memo: 'Rent',
    });

    const confirmation = {
      confirmationNumber: 'CONF-123',
      status: 'completed',
      timestamp: new Date().toISOString(),
    };
    result$.next(confirmation);
    result$.complete();

    expect(component.transferSuccess).toBe(true);
    expect(component.confirmationNumber).toBe('CONF-123');
    expect(component.isSubmitting).toBe(false);
    expect(analyticsService.trackTransaction).toHaveBeenCalledWith('internal_transfer', 25);
    expect(accountsService.invalidateCache).toHaveBeenCalled();
  });

  it('resets submitting state on error', () => {
    transfersService.submitTransfer.mockReturnValueOnce(throwError(() => new Error('fail')));
    component.transferForm.setValue({
      fromAccountId: 'acct-1',
      toAccountId: 'acct-2',
      amount: 15,
      memo: '',
    });

    component.onSubmit();

    expect(component.isSubmitting).toBe(false);
    expect(component.transferSuccess).toBe(false);
  });
});
