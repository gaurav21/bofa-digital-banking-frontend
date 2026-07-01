import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AccountsService, AccountOverview } from './accounts.service';
import { environment } from '../../../environments/environment';

describe('AccountsService', () => {
  let service: AccountsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AccountsService],
    });
    service = TestBed.inject(AccountsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('caches account overview responses and sends auth headers', () => {
    const overview: AccountOverview = {
      totalBalance: 250,
      accounts: [],
      recentTransactions: [],
    };
    let first: AccountOverview | undefined;
    let second: AccountOverview | undefined;

    service.getAccountOverview().subscribe((result) => (first = result));
    const req = httpMock.expectOne(`${environment.coreBankingApiUrl}/v2/accounts/overview`);
    expect(req.request.headers.get('X-BofA-Channel')).toBe('digital-banking-web');
    expect(req.request.headers.get('X-BofA-Client-Version')).toBe('14.1.3');
    req.flush(overview);

    service.getAccountOverview().subscribe((result) => (second = result));
    expect(httpMock.match(`${environment.coreBankingApiUrl}/v2/accounts/overview`)).toHaveLength(0);
    expect(first).toEqual(overview);
    expect(second).toEqual(overview);
  });

  it('returns an empty overview on error', () => {
    let overview: AccountOverview | undefined;

    service.getAccountOverview().subscribe((result) => (overview = result));

    const req = httpMock.expectOne(`${environment.coreBankingApiUrl}/v2/accounts/overview`);
    req.flush('fail', { status: 500, statusText: 'Server Error' });

    expect(overview).toEqual({ totalBalance: 0, accounts: [], recentTransactions: [] });
  });

  it('fetches account details', () => {
    service.getAccountDetails('acct-1').subscribe();

    const req = httpMock.expectOne(`${environment.coreBankingApiUrl}/v2/accounts/acct-1`);
    expect(req.request.headers.get('X-BofA-Channel')).toBe('digital-banking-web');
    req.flush({
      accountId: 'acct-1',
      accountType: 'checking',
      accountName: 'Primary',
      maskedNumber: '1234',
      balance: 100,
      availableBalance: 100,
      currency: 'USD',
    });
  });

  it('maps transactions and invalidates the cache', () => {
    let transactions: any[] = [];

    service.getTransactions('acct-1', 1, 50).subscribe((result) => (transactions = result));
    const first = httpMock.expectOne(
      (r) =>
        r.url === `${environment.coreBankingApiUrl}/v2/accounts/acct-1/transactions` &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '50'
    );
    first.flush({
      transactions: [
        {
          transactionId: 'txn-1',
          date: '2024-01-01T00:00:00Z',
          description: 'Coffee',
          category: 'Food',
          amount: 5,
          type: 'debit',
          status: 'posted',
        },
      ],
    });

    expect(transactions).toEqual([
      {
        transactionId: 'txn-1',
        date: '2024-01-01T00:00:00Z',
        description: 'Coffee',
        category: 'Food',
        amount: 5,
        type: 'debit',
        status: 'posted',
      },
    ]);

    service.invalidateCache();
    service.getAccountOverview().subscribe();
    const secondReq = httpMock.expectOne(`${environment.coreBankingApiUrl}/v2/accounts/overview`);
    secondReq.flush({ totalBalance: 0, accounts: [], recentTransactions: [] });
  });
});
