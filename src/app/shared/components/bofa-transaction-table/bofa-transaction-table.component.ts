import { Component, Input, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

export interface Transaction {
  transactionId: string;
  date: Date;
  description: string;
  category: string;
  amount: number;
  type: 'debit' | 'credit';
  status: 'posted' | 'pending' | 'declined';
  merchantName?: string;
}

@Component({
  selector: 'bofa-transaction-table',
  template: `
    <div class="bofa-txn-table-container">
      <mat-form-field appearance="outline" class="bofa-filter-field">
        <mat-label>Filter transactions</mat-label>
        <input matInput (keyup)="applyFilter($event)" placeholder="Search..." />
      </mat-form-field>

      <table mat-table [dataSource]="dataSource" matSort class="bofa-txn-table">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
          <td mat-cell *matCellDef="let txn">{{ txn.date | date: 'MM/dd/yyyy' }}</td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Description</th>
          <td mat-cell *matCellDef="let txn">{{ txn.description }}</td>
        </ng-container>

        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
          <td mat-cell *matCellDef="let txn">
            <span class="txn-category-chip">{{ txn.category }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Amount</th>
          <td
            mat-cell
            *matCellDef="let txn"
            [class.amount-debit]="txn.type === 'debit'"
            [class.amount-credit]="txn.type === 'credit'"
          >
            {{ txn.type === 'debit' ? '-' : '+' }}{{ txn.amount | currency: 'USD' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let txn">
            <span [class]="'txn-status txn-status--' + txn.status">{{ txn.status | titlecase }}</span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>

      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
    </div>
  `,
  styles: [
    `
      .bofa-txn-table-container {
        width: 100%;
      }
      .bofa-filter-field {
        width: 100%;
        margin-bottom: 8px;
      }
      .bofa-txn-table {
        width: 100%;
      }
      .amount-debit {
        color: #dc1431;
      }
      .amount-credit {
        color: #008540;
      }
      .txn-status--pending {
        color: #b5850b;
      }
      .txn-status--declined {
        color: #dc1431;
      }
      .txn-category-chip {
        background: #e8edf3;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.85em;
      }
    `,
  ],
})
export class BofaTransactionTableComponent implements OnInit, AfterViewInit {
  @Input() transactions: Transaction[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['date', 'description', 'category', 'amount', 'status'];
  dataSource = new MatTableDataSource<Transaction>();

  ngOnInit(): void {
    this.dataSource.data = this.transactions;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
