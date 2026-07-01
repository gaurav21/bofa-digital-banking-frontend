import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';
import { Component, PLATFORM_ID } from '@angular/core';

import { BofAAnalyticsService } from './bofa-analytics.sdk';
import { environment } from '../../../environments/environment';

@Component({ template: '' })
class DummyComponent {}

jest.setTimeout(10000);

describe('BofAAnalyticsService', () => {
  let service: BofAAnalyticsService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: 'accounts', component: DummyComponent }]),
      ],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    service = TestBed.inject(BofAAnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
  });

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('tracks events and batches them for flush', async () => {
    service.trackEvent('accounts_viewed', { source: 'dashboard' });
    service.trackTransaction('internal_transfer', 25);
    service.trackFunnelStep('fund_transfer', 2, 'submitted');

    await wait(5100);

    const req = httpMock.expectOne(`${environment.analyticsEndpoint}/v1/events/batch`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.events).toHaveLength(3);
    expect(req.request.body.events.map((event: any) => event.eventName)).toEqual([
      'accounts_viewed',
      'txn_internal_transfer',
      'funnel_fund_transfer',
    ]);

    req.flush({ ok: true });
  });

  it('logs only the status when a batch flush fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    service.trackEvent('batch_fail_check');

    await wait(5100);
    const req = httpMock.expectOne(`${environment.analyticsEndpoint}/v1/events/batch`);
    req.flush('fail', { status: 503, statusText: 'Service Unavailable' });

    expect(warnSpy).toHaveBeenCalledWith('[BofA Analytics] Batch flush failed:', 503);
  });

  it('sets user consent state', () => {
    service.setUserConsent(true);
    expect((service as any)._consentGranted$.getValue()).toBe(true);
  });

  it('tracks page views from router navigation', async () => {
    await router.navigateByUrl('/accounts');
    await wait(5100);

    const req = httpMock.expectOne(`${environment.analyticsEndpoint}/v1/events/batch`);
    expect(req.request.body.events.some((event: any) => event.eventType === 'page_view')).toBe(true);
    req.flush({ ok: true });
  });
});
