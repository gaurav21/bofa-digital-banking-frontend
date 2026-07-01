import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BofaAccountCardComponent, AccountSummary } from './bofa-account-card.component';
import { BofaAccountCardModule } from './bofa-account-card.module';

describe('BofaAccountCardComponent', () => {
  let fixture: ComponentFixture<BofaAccountCardComponent>;
  let component: BofaAccountCardComponent;
  const account: AccountSummary = {
    accountId: 'acct-1',
    accountType: 'checking',
    accountName: 'Primary Checking',
    maskedNumber: '1234',
    balance: 1234.56,
    availableBalance: 1200.56,
    currency: 'USD',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BofaAccountCardModule, NoopAnimationsModule],
    });

    fixture = TestBed.createComponent(BofaAccountCardComponent);
    component = fixture.componentInstance;
    component.account = account;
    fixture.detectChanges();
  });

  it('renders only the masked account number', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('••1234');
    expect(text).not.toContain('1234567890123456');
  });

  it('returns the correct icon name for the account type', () => {
    expect(component.getAccountIcon()).toBe('account_balance');
    component.account = { ...account, accountType: 'savings' };
    expect(component.getAccountIcon()).toBe('savings');
    component.account = { ...account, accountType: 'credit' };
    expect(component.getAccountIcon()).toBe('credit_card');
  });

  it('emits account actions', () => {
    const viewSpy = jest.fn();
    const transferSpy = jest.fn();
    component.onViewDetails.subscribe(viewSpy);
    component.onTransfer.subscribe(transferSpy);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();

    expect(viewSpy).toHaveBeenCalledWith(account);
    expect(transferSpy).toHaveBeenCalledWith(account);
  });
});
