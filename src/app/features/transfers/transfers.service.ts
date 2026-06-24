import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  memo?: string;
}

export interface TransferResult {
  confirmationNumber: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class TransfersService {
  private readonly API_BASE = environment.coreBankingApiUrl;

  private http = inject(HttpClient);

  submitTransfer(request: TransferRequest): Observable<TransferResult> {
    return this.http.post<TransferResult>(`${this.API_BASE}/v2/transfers/internal`, request, {
      headers: new HttpHeaders({
        'X-BofA-Channel': 'digital-banking-web',
        'X-BofA-Idempotency-Key': this._generateIdempotencyKey(),
      }),
    });
  }

  getTransferHistory(page = 0): Observable<TransferResult[]> {
    return this.http
      .get<{
        transfers: TransferResult[];
      }>(`${this.API_BASE}/v2/transfers/history`, { params: { page: page.toString() } })
      .pipe(map((res) => res.transfers));
  }

  private _generateIdempotencyKey(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}
