import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AccountSummary {
  accountId: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  accountName: string;
  maskedNumber: string;
  balance: number;
  availableBalance: number;
  currency: string;
}

@Component({
  selector: 'app-bofa-account-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="bofa-account-card" [class.bofa-account-card--selected]="selected">
      <mat-card-header>
        <mat-icon mat-card-avatar [class]="'account-icon--' + account.accountType">
          {{ getAccountIcon() }}
        </mat-icon>
        <mat-card-title>{{ account.accountName }}</mat-card-title>
        <mat-card-subtitle>{{ account.accountType | titlecase }} ••{{ account.maskedNumber }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="balance-display">
          <span class="balance-label">Available Balance</span>
          <span class="balance-amount">{{ account.availableBalance | currency: account.currency }}</span>
        </div>
        <div class="balance-display balance-display--secondary">
          <span class="balance-label">Current Balance</span>
          <span class="balance-amount">{{ account.balance | currency: account.currency }}</span>
        </div>
      </mat-card-content>
      <mat-card-actions align="end">
        <button mat-button color="primary" (click)="viewDetails.emit(account)">VIEW DETAILS</button>
        <button mat-button (click)="transfer.emit(account)">TRANSFER</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      .bofa-account-card {
        margin-bottom: 16px;
        border-left: 4px solid #012169;
      }
      .bofa-account-card--selected {
        border-left-color: #dc1431;
      }
      .balance-display {
        display: flex;
        justify-content: space-between;
        margin: 8px 0;
      }
      .balance-amount {
        font-size: 1.25rem;
        font-weight: 600;
        color: #012169;
      }
      .balance-display--secondary .balance-amount {
        font-size: 1rem;
        color: #666;
      }
    `,
  ],
})
export class BofaAccountCardComponent {
  @Input() account!: AccountSummary;
  @Input() selected = false;
  @Output() viewDetails = new EventEmitter<AccountSummary>();
  @Output() transfer = new EventEmitter<AccountSummary>();

  getAccountIcon(): string {
    const icons: Record<string, string> = {
      checking: 'account_balance',
      savings: 'savings',
      credit: 'credit_card',
      investment: 'trending_up',
    };
    return icons[this.account.accountType] || 'account_balance';
  }
}
