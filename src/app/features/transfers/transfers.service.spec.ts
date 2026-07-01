import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TransfersService, TransferRequest } from './transfers.service';
import { environment } from '../../../environments/environment';

describe('TransfersService', () => {
  let service: TransfersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransfersService],
    });
    service = TestBed.inject(TransfersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts internal transfers with channel and idempotency headers', () => {
    const request: TransferRequest = {
      fromAccountId: 'acct-1',
      toAccountId: 'acct-2',
      amount: 42,
      memo: 'Rent',
    };

    service.submitTransfer(request).subscribe();

    const req = httpMock.expectOne(`${environment.coreBankingApiUrl}/v2/transfers/internal`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-BofA-Channel')).toBe('digital-banking-web');
    expect(req.request.headers.get('X-BofA-Idempotency-Key')).toMatch(/^txn_/);
    expect(req.request.body).toEqual(request);

    req.flush({
      confirmationNumber: 'CONF-1',
      status: 'completed',
      timestamp: new Date().toISOString(),
    });
  });

  it('maps transfer history responses to arrays', () => {
    let transfers: any[] = [];

    service.getTransferHistory(2).subscribe((result) => (transfers = result));

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.coreBankingApiUrl}/v2/transfers/history` && r.params.get('page') === '2'
    );
    req.flush({
      transfers: [
        {
          confirmationNumber: 'CONF-1',
          status: 'completed',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
    });

    expect(transfers).toEqual([
      {
        confirmationNumber: 'CONF-1',
        status: 'completed',
        timestamp: '2024-01-01T00:00:00Z',
      },
    ]);
  });
});
