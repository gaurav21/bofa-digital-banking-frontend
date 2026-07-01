import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { BroadcasterService } from './broadcaster.service';
import { CONSTANTS } from './constants';
import { HTTPReqResInterceptor } from './http-req-res.interceptor';
import { AuthToken } from '@core/models/auth.model';

describe('HTTPReqResInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let broadcaster: BroadcasterService;
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        BroadcasterService,
        { provide: 'BASE_URL', useValue: baseUrl },
        { provide: HTTP_INTERCEPTORS, useClass: HTTPReqResInterceptor, multi: true },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    broadcaster = TestBed.inject(BroadcasterService);
  });

  afterEach(() => {
    httpMock.verify();
    jest.restoreAllMocks();
  });

  it('prefixes the base URL, broadcasts loader state, refreshes 401s, and retries with the new bearer token', () => {
    const loaderStates: boolean[] = [];
    broadcaster.listen<boolean>(CONSTANTS.SHOW_LOADER).subscribe((value) => loaderStates.push(value));

    jest
      .spyOn(authService, 'refreshToken')
      .mockReturnValue(of({ access_token: 'new-access', refresh_token: 'new-refresh' } as AuthToken));
    const storeSpy = jest.spyOn(authService, 'storeToken');

    let result: any;
    http.get('/secure/accounts').subscribe((value) => (result = value));

    const original = httpMock.expectOne(`${baseUrl}/secure/accounts`);
    expect(original.request.headers.get('custom_header')).toBe('value');
    original.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    const retried = httpMock.expectOne(`${baseUrl}/secure/accounts`);
    expect(retried.request.headers.get(CONSTANTS.AUTH_HEADER)).toBe('Bearer new-access');
    retried.flush({ ok: true });

    expect(result).toEqual({ ok: true });
    expect(loaderStates[0]).toBe(true);
    expect(loaderStates[loaderStates.length - 1]).toBe(false);
    expect(loaderStates.length).toBeGreaterThanOrEqual(2);
    expect(storeSpy).toHaveBeenCalledWith({ access_token: 'new-access', refresh_token: 'new-refresh' });
  });

  it('logs out when token refresh fails after a 401', () => {
    const logoutSpy = jest.spyOn(authService, 'logout');
    jest.spyOn(authService, 'refreshToken').mockReturnValue(throwError(() => new Error('refresh failed')));
    logoutSpy.mockImplementation(() => undefined as any);

    http.get('/secure/fail').subscribe({ error: () => undefined });

    const original = httpMock.expectOne(`${baseUrl}/secure/fail`);
    original.flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
  });

  it('broadcasts a generic error payload for non-401 failures', () => {
    const errorMessages: any[] = [];
    broadcaster.listen<any>(CONSTANTS.ERROR).subscribe((value) => errorMessages.push(value));

    http.get('/secure/error').subscribe({ error: () => undefined });

    const req = httpMock.expectOne(`${baseUrl}/secure/error`);
    req.flush('server error', { status: 500, statusText: 'Server Error' });

    expect(errorMessages).toEqual([{ error: 'Something went wrong', timeout: 5000 }]);
    expect(errorMessages[0].error).not.toMatch(/\d/);
    expect(errorMessages[0]).not.toHaveProperty('stack');
  });
});
