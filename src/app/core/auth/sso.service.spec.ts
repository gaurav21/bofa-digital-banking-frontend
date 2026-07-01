import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SsoAuthService, BofAUserSession } from './sso.service';
import { environment } from '../../../environments/environment';

describe('SsoAuthService', () => {
  let service: SsoAuthService;
  let httpMock: HttpTestingController;

  const validSession: BofAUserSession = {
    userId: 'user-1',
    accountId: 'acct-1',
    roles: ['customer'],
    mfaVerified: true,
    sessionToken: 'session-1',
    expiresAt: Date.now() + 60_000,
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (array: Uint8Array) => {
          array.fill(7);
          return array;
        },
      },
      configurable: true,
    });
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    localStorage.clear();
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('restores a valid session from storage in the constructor', async () => {
    localStorage.setItem('bofa_session', JSON.stringify(validSession));

    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    await expect(firstValueFrom(service.currentSession$)).resolves.toEqual(validSession);
    await expect(firstValueFrom(service.isAuthenticated$)).resolves.toBe(true);
  });

  it('does not restore an expired session', async () => {
    localStorage.setItem('bofa_session', JSON.stringify({ ...validSession, expiresAt: Date.now() - 1 }));

    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    await expect(firstValueFrom(service.currentSession$)).resolves.toBeNull();
    await expect(firstValueFrom(service.isAuthenticated$)).resolves.toBe(false);
  });

  it('ignores corrupted stored session JSON', async () => {
    localStorage.setItem('bofa_session', '{bad json');

    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    await expect(firstValueFrom(service.currentSession$)).resolves.toBeNull();
  });

  it('initiateLogin stores PKCE state and returns the authorization URL', async () => {
    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    let authorizationUrl = '';
    service.initiateLogin('/secure').subscribe((value) => (authorizationUrl = value));

    const req = httpMock.expectOne(`${environment.ssoGatewayUrl}/v2/authorize`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-BofA-Channel')).toBe('digital-banking-web');
    expect(req.request.body.client_id).toBe(environment.oauthClientId);
    expect(req.request.body.code_challenge).toBeTruthy();
    expect(sessionStorage.getItem('bofa_pkce_verifier')).toBeTruthy();
    expect(sessionStorage.getItem('bofa_return_url')).toBe('/secure');

    req.flush({ authorizationUrl: 'https://sso.example/login' });

    expect(authorizationUrl).toBe('https://sso.example/login');
  });

  it('maps initiateLogin errors', async () => {
    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    const promise = firstValueFrom(service.initiateLogin('/error'));
    const req = httpMock.expectOne(`${environment.ssoGatewayUrl}/v2/authorize`);
    req.flush('boom', { status: 503, statusText: 'Service Unavailable' });

    await expect(promise).rejects.toThrow('SSO init failed: 503');
  });

  it('exchanges code for a session and publishes it', async () => {
    sessionStorage.setItem('bofa_pkce_verifier', 'verifier-1');
    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    const sessions: Array<BofAUserSession | null> = [];
    service.currentSession$.subscribe((session) => sessions.push(session));

    const response: BofAUserSession = { ...validSession, sessionToken: 'session-2' };
    service.exchangeCodeForSession('auth-code-1').subscribe();

    const req = httpMock.expectOne(`${environment.ssoGatewayUrl}/v2/token`);
    expect(req.request.body).toEqual({
      code: 'auth-code-1',
      code_verifier: 'verifier-1',
      client_id: environment.oauthClientId,
    });
    req.flush(response);

    expect(localStorage.getItem('bofa_session')).toBe(JSON.stringify(response));
    expect(sessions[sessions.length - 1]).toEqual(response);
  });

  it('maps exchangeCodeForSession errors', async () => {
    sessionStorage.setItem('bofa_pkce_verifier', 'verifier-1');
    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    const promise = firstValueFrom(service.exchangeCodeForSession('bad-code'));
    const req = httpMock.expectOne(`${environment.ssoGatewayUrl}/v2/token`);
    req.flush('bad', { status: 400, statusText: 'Bad Request' });

    await expect(promise).rejects.toThrow(
      'Token exchange failed: Http failure response for https://sso-dev.bofa.internal/v2/token: 400 Bad Request'
    );
  });

  it('throws when requesting MFA without an active session', async () => {
    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    await expect(firstValueFrom(service.requestMfaChallenge('sms'))).rejects.toThrow('No active session for MFA');
  });

  it('requests MFA challenge with a Bearer header', () => {
    localStorage.setItem('bofa_session', JSON.stringify(validSession));
    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    service.requestMfaChallenge('sms').subscribe();

    const req = httpMock.expectOne(`${environment.ssoGatewayUrl}/v2/mfa/challenge`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validSession.sessionToken}`);
    expect(req.request.body).toEqual({ method: 'sms', sessionToken: validSession.sessionToken });
    req.flush({ challengeId: 'challenge-1', method: 'sms', maskedTarget: '***-***-1234' });
  });

  it('updates the session after MFA verification', () => {
    localStorage.setItem('bofa_session', JSON.stringify(validSession));
    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    const updatedSession = { ...validSession, mfaVerified: true, sessionToken: 'session-3' };
    service.verifyMfa('challenge-1', '123456').subscribe((session) => {
      expect(session).toEqual(updatedSession);
    });

    const req = httpMock.expectOne(`${environment.ssoGatewayUrl}/v2/mfa/verify`);
    req.flush(updatedSession);

    expect(localStorage.getItem('bofa_session')).toBe(JSON.stringify(updatedSession));
  });

  it('logs out by clearing storage and emitting null', async () => {
    localStorage.setItem('bofa_session', JSON.stringify(validSession));
    sessionStorage.setItem('bofa_pkce_verifier', 'verifier-1');
    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    const sessions: Array<BofAUserSession | null> = [];
    service.currentSession$.subscribe((session) => sessions.push(session));

    service.logout();

    expect(localStorage.getItem('bofa_session')).toBeNull();
    expect(sessionStorage.getItem('bofa_pkce_verifier')).toBeNull();
    expect(sessions[sessions.length - 1]).toBeNull();
  });

  it('reflects expiry changes in isAuthenticated$', async () => {
    localStorage.setItem('bofa_session', JSON.stringify({ ...validSession, expiresAt: Date.now() }));

    service = TestBed.inject(SsoAuthService);
    httpMock = TestBed.inject(HttpTestingController);

    await expect(firstValueFrom(service.isAuthenticated$)).resolves.toBe(false);
  });
});
