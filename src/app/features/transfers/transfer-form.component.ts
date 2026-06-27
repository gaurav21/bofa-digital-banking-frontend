import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TransfersService, TransferRequest } from './transfers.service';
import { AccountsService } from '../accounts/accounts.service';
import { BofAAnalyticsService } from '../../core/analytics/bofa-analytics.sdk';
import { AccountSummary } from '../../shared/components/bofa-account-card/bofa-account-card.component';

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="transfer-container">
      <h1 class="transfer-title">Transfer Funds</h1>

      <form [formGroup]="transferForm" (ngSubmit)="onSubmit()" class="transfer-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>From Account</mat-label>
          <mat-select formControlName="fromAccountId">
            <mat-option *ngFor="let acct of accounts" [value]="acct.accountId">
              {{ acct.accountName }} ({{ acct.availableBalance | currency: 'USD' }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>To Account</mat-label>
          <mat-select formControlName="toAccountId">
            <mat-option *ngFor="let acct of accounts" [value]="acct.accountId">
              {{ acct.accountName }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount</mat-label>
          <input matInput type="number" formControlName="amount" min="0.01" step="0.01" />
          <span matPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Memo (optional)</mat-label>
          <input matInput formControlName="memo" maxlength="140" />
        </mat-form-field>

        <div class="transfer-actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="!transferForm.valid || isSubmitting">
            {{ isSubmitting ? 'Processing...' : 'Transfer' }}
          </button>
          <button mat-button type="button" routerLink="/accounts">Cancel</button>
        </div>
      </form>

      <div *ngIf="transferSuccess" class="transfer-success">
        <mat-icon>check_circle</mat-icon>
        <span>Transfer completed successfully. Confirmation #{{ confirmationNumber }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .transfer-container {
        padding: 24px;
        max-width: 600px;
        margin: 0 auto;
      }
      .transfer-title {
        color: #012169;
      }
      .full-width {
        width: 100%;
      }
      .transfer-actions {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }
      .transfer-success {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #008540;
        padding: 16px;
        background: #e8f5e9;
        border-radius: 4px;
        margin-top: 16px;
      }
    `,
  ],
})
export class TransferFormComponent implements OnInit, OnDestroy {
  transferForm!: FormGroup;
  accounts: AccountSummary[] = [];
  isSubmitting = false;
  transferSuccess = false;
  confirmationNumber = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private transfersService: TransfersService,
    private accountsService: AccountsService,
    private analytics: BofAAnalyticsService,
  ) {}

  ngOnInit(): void {
    this.analytics.trackFunnelStep('fund_transfer', 1, 'form_opened');

    this.transferForm = this.fb.group({
      fromAccountId: ['', Validators.required],
      toAccountId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      memo: [''],
    });

    this.accountsService
      .getAccountOverview()
      .pipe(takeUntil(this.destroy$))
      .subscribe((overview) => {
        this.accounts = overview.accounts;
      });
  }

  onSubmit(): void {
    if (!this.transferForm.valid) return;
    this.isSubmitting = true;

    const request: TransferRequest = this.transferForm.value;
    this.analytics.trackFunnelStep('fund_transfer', 2, 'form_submitted');

    this.transfersService
      .submitTransfer(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.transferSuccess = true;
          this.confirmationNumber = result.confirmationNumber;
          this.isSubmitting = false;
          this.analytics.trackTransaction('internal_transfer', request.amount);
          this.accountsService.invalidateCache();
        },
        error: () => {
          this.isSubmitting = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
