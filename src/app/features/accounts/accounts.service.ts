import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AccountSummary } from '../../shared/components/bofa-account-card/bofa-account-card.component';
import { Transaction } from '../../shared/components/bofa-transaction-table/bofa-transaction-table.component';

export interface AccountOverview {
  totalBalance: number;
  accounts: AccountSummary[];
  recentTransactions: Transaction[];
}

@Injectable({
  providedIn: 'root',
})
export class AccountsService {
  private readonly API_BASE = environment.coreBankingApiUrl;

  private overview$: Observable<AccountOverview> | null = null;

  constructor(private http: HttpClient) {}

  getAccountOverview(): Observable<AccountOverview> {
    if (!this.overview$) {
      this.overview$ = this.http
        .get<AccountOverview>(`${this.API_BASE}/v2/accounts/overview`, { headers: this._authHeaders() })
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(() =>
            of({
              totalBalance: 0,
              accounts: [],
              recentTransactions: [],
            }),
          ),
        );
    }
    return this.overview$;
  }

  getAccountDetails(accountId: string): Observable<AccountSummary> {
    return this.http.get<AccountSummary>(`${this.API_BASE}/v2/accounts/${accountId}`, { headers: this._authHeaders() });
  }

  getTransactions(accountId: string, page = 0, size = 25): Observable<Transaction[]> {
    return this.http
      .get<{ transactions: Transaction[] }>(`${this.API_BASE}/v2/accounts/${accountId}/transactions`, {
        headers: this._authHeaders(),
        params: { page: page.toString(), size: size.toString() },
      })
      .pipe(map((res) => res.transactions));
  }

  invalidateCache(): void {
    this.overview$ = null;
  }

  private _authHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-BofA-Channel': 'digital-banking-web',
      'X-BofA-Client-Version': '18.2.0',
    });
  }
}
