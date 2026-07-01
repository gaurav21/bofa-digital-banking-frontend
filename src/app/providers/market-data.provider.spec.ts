import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';

import { MarketDataProvider } from './market-data.provider';
import { environment } from '../../environments/environment';

describe('MarketDataProvider', () => {
  let provider: MarketDataProvider;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MarketDataProvider],
    });

    provider = TestBed.inject(MarketDataProvider);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('polls market indices and updates the indices stream', fakeAsync(() => {
    let latest: any[] = [];
    provider.indices$.subscribe((value) => (latest = value));
    provider.startMarketFeed().subscribe();

    tick(0);
    const first = httpMock.expectOne(
      (req) => req.url === `${environment.marketDataApiUrl}/v1/indices` && req.params.get('symbols') === 'DJI,SPX,IXIC'
    );
    first.flush([
      {
        symbol: 'DJI',
        price: 100,
        change: 1,
        changePercent: 1,
        volume: 1,
        lastUpdated: new Date().toISOString(),
      },
    ]);

    tick(30000);
    const second = httpMock.expectOne((req) => req.url === `${environment.marketDataApiUrl}/v1/indices`);
    second.flush([
      {
        symbol: 'DJI',
        price: 101,
        change: 1,
        changePercent: 1,
        volume: 2,
        lastUpdated: new Date().toISOString(),
      },
    ]);

    expect(latest[0].price).toBe(101);
    discardPeriodicTasks();
  }));

  it('gets quotes and portfolio valuations', () => {
    provider.getQuote('AAPL').subscribe();
    const quoteReq = httpMock.expectOne(`${environment.marketDataApiUrl}/v1/quotes/AAPL`);
    quoteReq.flush({
      symbol: 'AAPL',
      price: 123,
      change: 2,
      changePercent: 1.6,
      volume: 1,
      lastUpdated: new Date().toISOString(),
    });

    provider.getPortfolioValuation('acct-1').subscribe();
    const portfolioReq = httpMock.expectOne(`${environment.marketDataApiUrl}/v1/portfolios/acct-1/valuation`);
    portfolioReq.flush({
      totalValue: 1000,
      dayChange: 10,
      dayChangePercent: 1,
      holdings: [{ symbol: 'AAPL', shares: 5, value: 615 }],
    });
  });

  it('swallows polling errors into EMPTY', fakeAsync(() => {
    provider.startMarketFeed().subscribe({ error: () => undefined });

    tick(0);
    for (let i = 0; i < 4; i++) {
      const req = httpMock.expectOne(
        (req) =>
          req.url === `${environment.marketDataApiUrl}/v1/indices` && req.params.get('symbols') === 'DJI,SPX,IXIC'
      );
      req.flush('fail', { status: 500, statusText: 'Server Error' });
      tick();
    }

    discardPeriodicTasks();
  }));
});
