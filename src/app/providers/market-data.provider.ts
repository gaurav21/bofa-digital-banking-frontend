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

@Injectable({
  providedIn: 'root',
})
export class MarketDataProvider {
  private readonly MARKET_API = environment.marketDataApiUrl;
  private readonly POLL_INTERVAL_MS = 30000;

  private _indices$ = new BehaviorSubject<MarketQuote[]>([]);
  public indices$ = this._indices$.asObservable();

  constructor(private http: HttpClient) {}

  startMarketFeed(): Observable<MarketQuote[]> {
    return timer(0, this.POLL_INTERVAL_MS).pipe(
      switchMap(() =>
        this.http.get<MarketQuote[]>(`${this.MARKET_API}/v1/indices`, { params: { symbols: 'DJI,SPX,IXIC' } }),
      ),
      retry({ count: 3 }),
      tap((quotes) => this._indices$.next(quotes)),
      catchError(() => EMPTY),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  getQuote(symbol: string): Observable<MarketQuote> {
    return this.http.get<MarketQuote>(`${this.MARKET_API}/v1/quotes/${symbol}`);
  }

  getPortfolioValuation(accountId: string): Observable<PortfolioValuation> {
    return this.http
      .get<PortfolioValuation>(`${this.MARKET_API}/v1/portfolios/${accountId}/valuation`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }
}
