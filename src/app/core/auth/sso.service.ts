import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BofAUserSession {
  userId: string;
  accountId: string;
  roles: string[];
  mfaVerified: boolean;
  sessionToken: string;
  expiresAt: number;
}

export interface MfaChallenge {
  challengeId: string;
  method: 'sms' | 'email' | 'authenticator' | 'biometric';
  maskedTarget: string;
}

/**
 * BofA SSO/MFA Authentication Service
 *
 * Integrates with BofA Identity Platform (OAuth 2.0 + PKCE).
 * Uses Angular 14 patterns — will need significant refactoring for Angular 18:
 *   - Injectable providedIn pattern changes
 *   - HttpClient standalone API
 *   - RxJS operator deprecations
 */
@Injectable({
  providedIn: 'root'
})
export class SsoAuthService {

  private readonly SSO_BASE_URL = environment.ssoGatewayUrl;
  private readonly CLIENT_ID = environment.oauthClientId;

  // BehaviorSubject pattern — Angular 14 style state management
  private _currentSession$ = new BehaviorSubject<BofAUserSession | null>(null);
  public currentSession$ = this._currentSession$.asObservable();

  // Deprecated: shareReplay without config object (refCount not specified)
  public isAuthenticated$: Observable<boolean> = this.currentSession$.pipe(
    map(session => !!session && session.expiresAt > Date.now()),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {
    this._restoreSessionFromStorage();
  }

  /**
   * Initiate SSO login via BofA Identity Platform
   * Uses PKCE flow with internal OAuth provider
   */
  initiateLogin(returnUrl: string = '/'): Observable<string> {
    const codeVerifier = this._generateCodeVerifier();
    const codeChallenge = this._generateCodeChallenge(codeVerifier);

    sessionStorage.setItem('bofa_pkce_verifier', codeVerifier);
    sessionStorage.setItem('bofa_return_url', returnUrl);

    return this.http.post<{ authorizationUrl: string }>(
      `${this.SSO_BASE_URL}/v2/authorize`,
      {
        client_id: this.CLIENT_ID,
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        scope: 'openid profile accounts transactions',
        redirect_uri: environment.ssoCallbackUrl
      },
      { headers: new HttpHeaders({ 'X-BofA-Channel': 'digital-banking-web' }) }
    ).pipe(
      map(response => response.authorizationUrl),
      catchError(err => throwError(() => new Error(`SSO init failed: ${err.status}`)))
    );
  }

  /**
   * Exchange authorization code for session token
   */
  exchangeCodeForSession(authCode: string): Observable<BofAUserSession> {
    const codeVerifier = sessionStorage.getItem('bofa_pkce_verifier') || '';

    return this.http.post<BofAUserSession>(
      `${this.SSO_BASE_URL}/v2/token`,
      { code: authCode, code_verifier: codeVerifier, client_id: this.CLIENT_ID }
    ).pipe(
      tap(session => {
        this._currentSession$.next(session);
        localStorage.setItem('bofa_session', JSON.stringify(session));
      }),
      catchError(err => throwError(() => new Error(`Token exchange failed: ${err.message}`)))
    );
  }

  /**
   * Request MFA challenge for step-up authentication
   */
  requestMfaChallenge(method: string): Observable<MfaChallenge> {
    const session = this._currentSession$.getValue();
    if (!session) {
      return throwError(() => new Error('No active session for MFA'));
    }

    return this.http.post<MfaChallenge>(
      `${this.SSO_BASE_URL}/v2/mfa/challenge`,
      { method, sessionToken: session.sessionToken },
      { headers: new HttpHeaders({ 'Authorization': `Bearer ${session.sessionToken}` }) }
    );
  }

  /**
   * Verify MFA challenge response
   */
  verifyMfa(challengeId: string, code: string): Observable<BofAUserSession> {
    return this.http.post<BofAUserSession>(
      `${this.SSO_BASE_URL}/v2/mfa/verify`,
      { challengeId, code }
    ).pipe(
      tap(updatedSession => {
        this._currentSession$.next(updatedSession);
        localStorage.setItem('bofa_session', JSON.stringify(updatedSession));
      })
    );
  }

  logout(): void {
    this._currentSession$.next(null);
    localStorage.removeItem('bofa_session');
    sessionStorage.removeItem('bofa_pkce_verifier');
  }

  private _restoreSessionFromStorage(): void {
    try {
      const stored = localStorage.getItem('bofa_session');
      if (stored) {
        const session: BofAUserSession = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          this._currentSession$.next(session);
        }
      }
    } catch { /* corrupted storage, ignore */ }
  }

  private _generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(36)).join('').substring(0, 43);
  }

  private _generateCodeChallenge(verifier: string): string {
    // Simplified — production uses SubtleCrypto SHA-256
    return btoa(verifier).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
