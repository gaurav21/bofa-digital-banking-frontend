import { Injectable, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, BehaviorSubject, interval } from 'rxjs';
import { filter, buffer, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';

export interface AnalyticsEvent {
  eventType: 'page_view' | 'action' | 'transaction' | 'error' | 'funnel_step';
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BofAAnalyticsService {
  private readonly ANALYTICS_ENDPOINT = environment.analyticsEndpoint;
  private readonly BATCH_INTERVAL_MS = 5000;
  private readonly MAX_BATCH_SIZE = 50;

  private eventStream$ = new Subject<AnalyticsEvent>();
  private sessionId: string;
  private _consentGranted$ = new BehaviorSubject<boolean>(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.sessionId = this._generateSessionId();
    this._initPageViewTracking();
    this._initBatchFlush();
  }

  trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    this.eventStream$.next({
      eventType: 'action',
      eventName,
      properties: { ...properties, channel: 'digital-banking-web' },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  trackTransaction(txnType: string, amount: number, currency: string = 'USD'): void {
    this.eventStream$.next({
      eventType: 'transaction',
      eventName: `txn_${txnType}`,
      properties: { amount, currency, txnType },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  trackFunnelStep(funnelName: string, step: number, stepName: string): void {
    this.eventStream$.next({
      eventType: 'funnel_step',
      eventName: `funnel_${funnelName}`,
      properties: { step, stepName, funnelName },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  setUserConsent(granted: boolean): void {
    this._consentGranted$.next(granted);
  }

  private _initPageViewTracking(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.eventStream$.next({
          eventType: 'page_view',
          eventName: 'page_view',
          properties: { url: event.urlAfterRedirects, title: document.title },
          timestamp: Date.now(),
          sessionId: this.sessionId,
        });
      });
  }

  private _initBatchFlush(): void {
    this.eventStream$
      .pipe(
        buffer(interval(this.BATCH_INTERVAL_MS)),
        filter((batch) => batch.length > 0),
        map((batch) => batch.slice(0, this.MAX_BATCH_SIZE)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((batch) => {
        this.http
          .post(`${this.ANALYTICS_ENDPOINT}/v1/events/batch`, {
            events: batch,
            sdkVersion: '3.18.0',
            clientId: environment.analyticsClientId,
          })
          .subscribe({
            error: (err) => console.warn('[BofA Analytics] Batch flush failed:', err.status),
          });
      });
  }

  private _generateSessionId(): string {
    return 'ses_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}
