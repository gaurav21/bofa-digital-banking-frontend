import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, Subject, BehaviorSubject, interval } from 'rxjs';
import { filter, buffer, map, takeUntil, debounceTime } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AnalyticsEvent {
  eventType: 'page_view' | 'action' | 'transaction' | 'error' | 'funnel_step';
  eventName: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

/**
 * BofA Proprietary Analytics SDK
 *
 * Tracks user behavior, funnel progression, and transaction analytics.
 * Uses Angular 14 DI patterns and old RxJS operators.
 *
 * Known issues for Angular 18 migration:
 *   - PLATFORM_ID injection via @Inject decorator (deprecated pattern)
 *   - interval() + buffer() pattern needs refactoring
 *   - NavigationEnd filter uses deprecated event type checking
 *   - Manual teardown via Subject (no DestroyRef available in Angular 14)
 */
@Injectable({
  providedIn: 'root'
})
export class BofAAnalyticsService {

  private readonly ANALYTICS_ENDPOINT = environment.analyticsEndpoint;
  private readonly BATCH_INTERVAL_MS = 5000;
  private readonly MAX_BATCH_SIZE = 50;

  private eventStream$ = new Subject<AnalyticsEvent>();
  private destroy$ = new Subject<void>();
  private sessionId: string;

  // Deprecated: BehaviorSubject for consent state (should use signal in Angular 18)
  private _consentGranted$ = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.sessionId = this._generateSessionId();
    this._initPageViewTracking();
    this._initBatchFlush();
  }

  /**
   * Track a custom analytics event
   */
  trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    this.eventStream$.next({
      eventType: 'action',
      eventName,
      properties: { ...properties, channel: 'digital-banking-web' },
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  /**
   * Track transaction events (transfers, payments, etc.)
   */
  trackTransaction(txnType: string, amount: number, currency: string = 'USD'): void {
    this.eventStream$.next({
      eventType: 'transaction',
      eventName: `txn_${txnType}`,
      properties: { amount, currency, txnType },
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  /**
   * Track funnel progression (onboarding, transfer flow, etc.)
   */
  trackFunnelStep(funnelName: string, step: number, stepName: string): void {
    this.eventStream$.next({
      eventType: 'funnel_step',
      eventName: `funnel_${funnelName}`,
      properties: { step, stepName, funnelName },
      timestamp: Date.now(),
      sessionId: this.sessionId
    });
  }

  setUserConsent(granted: boolean): void {
    this._consentGranted$.next(granted);
  }

  /**
   * Auto-track page views via Router events
   * Uses deprecated NavigationEnd instanceof check
   */
  private _initPageViewTracking(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Deprecated pattern: filter by instanceof (Angular 18 uses type-safe router events)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.eventStream$.next({
        eventType: 'page_view',
        eventName: 'page_view',
        properties: { url: event.urlAfterRedirects, title: document.title },
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    });
  }

  /**
   * Batch events and flush to analytics endpoint
   * Uses interval() + buffer() — old RxJS pattern
   */
  private _initBatchFlush(): void {
    this.eventStream$.pipe(
      buffer(interval(this.BATCH_INTERVAL_MS)),
      filter(batch => batch.length > 0),
      map(batch => batch.slice(0, this.MAX_BATCH_SIZE)),
      takeUntil(this.destroy$)
    ).subscribe(batch => {
      this.http.post(`${this.ANALYTICS_ENDPOINT}/v1/events/batch`, {
        events: batch,
        sdkVersion: '3.14.2',
        clientId: environment.analyticsClientId
      }).subscribe({
        error: (err) => console.warn('[BofA Analytics] Batch flush failed:', err.status)
      });
    });
  }

  private _generateSessionId(): string {
    return 'ses_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
