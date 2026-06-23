import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, EMPTY } from 'rxjs';
import { switchMap, retry, catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
}

export interface PortfolioValuation {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: { symbol: string; shares: number; value: number }[];
}

/**
 * Third-party financial market data provider
 *
 * Integrates with Refinitiv/Bloomberg-style data feed for
 * real-time market quotes and portfolio valuations.
 *
 * Angular 14 patterns:
 *   - timer() + switchMap() polling (should use signals/effects in Angular 18)
 *   - retry() without config object (deprecated signature)
 *   - shareReplay(1) without refCount
 */
@Injectable({
  providedIn: 'root'
})
export class MarketDataProvider {

  private readonly MARKET_API = environment.marketDataApiUrl;
  private readonly POLL_INTERVAL_MS = 30000;

  private _indices$ = new BehaviorSubject<MarketQuote[]>([]);
  public indices$ = this._indices$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Start polling market indices (DOW, S&P 500, NASDAQ)
   * Uses timer + switchMap — deprecated polling pattern
   */
  startMarketFeed(): Observable<MarketQuote[]> {
    return timer(0, this.POLL_INTERVAL_MS).pipe(
      switchMap(() => this.http.get<MarketQuote[]>(
        `${this.MARKET_API}/v1/indices`,
        { params: { symbols: 'DJI,SPX,IXIC' } }
      )),
      retry(3),  // Deprecated: retry(count) — Angular 18 uses retry({ count, delay })
      tap(quotes => this._indices$.next(quotes)),
      catchError(() => EMPTY),
      shareReplay(1)
    );
  }

  getQuote(symbol: string): Observable<MarketQuote> {
    return this.http.get<MarketQuote>(
      `${this.MARKET_API}/v1/quotes/${symbol}`
    );
  }

  getPortfolioValuation(accountId: string): Observable<PortfolioValuation> {
    return this.http.get<PortfolioValuation>(
      `${this.MARKET_API}/v1/portfolios/${accountId}/valuation`
    ).pipe(
      shareReplay(1)
    );
  }
}
