import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';

import { SsoAuthService } from '../core/auth/sso.service';
import { HTTPReqResInterceptor } from '../core/services/http-req-res.interceptor';
import { BroadcasterService } from '../core/services/broadcaster.service';
import { CONSTANTS } from '../core/services/constants';
import { BofAAnalyticsService } from '../core/analytics/bofa-analytics.sdk';

describe('PII handling', () => {
  let httpMock: HttpTestingController;
  let broadcaster: BroadcasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [BroadcasterService, SsoAuthService, BofAAnalyticsService],
    });

    httpMock = TestBed.inject(HttpTestingController);
    broadcaster = TestBed.inject(BroadcasterService);
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
  });

  it('exposes only a masked MFA target', () => {
    const service = TestBed.inject(SsoAuthService);
    let challenge: any;
    (service as any)._currentSession$.next({
      userId: 'u1',
      accountId: 'a1',
      roles: ['customer'],
      mfaVerified: false,
      sessionToken: 'token-1',
      expiresAt: Date.now() + 1000,
    });

    service.requestMfaChallenge('sms').subscribe((value) => (challenge = value));
    const req = httpMock.expectOne('https://sso-dev.bofa.internal/v2/mfa/challenge');
    req.flush({
      challengeId: 'c1',
      method: 'sms',
      maskedTarget: '***-***-1234',
    });

    expect(challenge).toEqual({
      challengeId: 'c1',
      method: 'sms',
      maskedTarget: '***-***-1234',
    });
    expect(challenge.maskedTarget).not.toContain('@');
  });

  it('broadcasts a generic interceptor error without sensitive details', () => {
    const messages: any[] = [];
    broadcaster.listen<any>(CONSTANTS.ERROR).subscribe((value) => messages.push(value));

    const interceptor = new HTTPReqResInterceptor('https://api.example.com', broadcaster, {
      refreshToken: jest.fn(),
      logout: jest.fn(),
      storeToken: jest.fn(),
    } as any);

    interceptor.handleError({ url: '/pii-check' } as any, {} as any, { status: 500 } as any);

    expect(messages).toEqual([{ error: 'Something went wrong', timeout: 5000 }]);
    expect(messages[0].error).not.toMatch(/\d/);
    expect(messages[0]).not.toHaveProperty('stack');
  });

  it('logs only the HTTP status when analytics batch flush fails', fakeAsync(() => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const analytics = TestBed.inject(BofAAnalyticsService);
    analytics.trackEvent('pii_check', { accountId: 'acct-1' });

    tick(5001);
    const req = httpMock.expectOne('https://analytics-dev.bofa.internal/v1/events/batch');
    req.flush('fail', { status: 503, statusText: 'Service Unavailable' });

    expect(warnSpy).toHaveBeenCalledWith('[BofA Analytics] Batch flush failed:', 503);
    tick(0);
    discardPeriodicTasks();
  }));
});
