import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BofaTransactionTableComponent, Transaction } from './bofa-transaction-table.component';
import { BofaTransactionTableModule } from './bofa-transaction-table.module';

describe('BofaTransactionTableComponent', () => {
  let fixture: ComponentFixture<BofaTransactionTableComponent>;
  let component: BofaTransactionTableComponent;
  const transactions: Transaction[] = [
    {
      transactionId: 'txn-1',
      date: new Date('2024-01-01T00:00:00Z'),
      description: 'Coffee',
      category: 'Food',
      amount: 5,
      type: 'debit',
      status: 'posted',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BofaTransactionTableModule, NoopAnimationsModule],
    });

    fixture = TestBed.createComponent(BofaTransactionTableComponent);
    component = fixture.componentInstance;
    component.transactions = transactions;
    fixture.detectChanges();
  });

  it('initializes the data source from the input', () => {
    expect(component.dataSource.data).toEqual(transactions);
  });

  it('applies the filter to the data source', () => {
    component.applyFilter({ target: { value: 'coffee' } } as any);
    expect(component.dataSource.filter).toBe('coffee');
  });

  it('wires paginator and sort after view init', () => {
    expect(component.dataSource.paginator).toBeTruthy();
    expect(component.dataSource.sort).toBeTruthy();
  });
});
