import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AuthToken, UserDetail } from '@core/models/auth.model';
import { CONSTANTS } from './constants';

let service: AuthService;
let httpMock: HttpTestingController;
let reloadSpy: jest.Mock;

// jsdom guards navigation differently across versions: some allow swapping
// window.location wholesale, others only allow redefining location.reload.
// Try both and verify the spy actually took effect so window.location.reload()
// never triggers real navigation regardless of the installed jsdom version.
function stubReload(): jest.Mock {
  const spy = jest.fn();
  try {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: spy, assign: jest.fn(), replace: jest.fn() } as unknown as Location,
    });
  } catch {
    /* location not replaceable in this jsdom */
  }
  if (window.location.reload !== spy) {
    try {
      Object.defineProperty(window.location, 'reload', { configurable: true, value: spy });
    } catch {
      /* reload not redefinable in this jsdom */
    }
  }
  return spy;
}

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [AuthService], imports: [HttpClientTestingModule] });
  localStorage.clear();
  service = TestBed.inject(AuthService);
  httpMock = TestBed.inject(HttpTestingController);
  reloadSpy = stubReload();
});

afterEach(() => {
  httpMock.verify();
  localStorage.clear();
});

it('should create', () => {
  expect(service).toBeTruthy();
});

it('login posts username/password form body', () => {
  const user: UserDetail = { username: 'jane.doe', password: 'Secret123!' };

  service.login(user).subscribe();

  const req = httpMock.expectOne('<login_URL>');
  expect(req.request.method).toBe('POST');
  expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
  expect(req.request.body).toContain(`${CONSTANTS.USERNAME}=jane.doe`);
  expect(req.request.body).toContain(`${CONSTANTS.PASSWORD}=Secret123!`);

  req.flush({ access_token: 'a', refresh_token: 'r' });
});

it('stores and reads tokens and logged-in state', () => {
  const token: AuthToken = { access_token: 'access-1', refresh_token: 'refresh-1' };

  service.storeToken(token);

  expect(service.getToken()).toBe('access-1');
  expect(service.getRefreshToken()).toBe('refresh-1');
  expect(service.isLoggedIn()).toBe(true);

  localStorage.removeItem('token');
  expect(service.isLoggedIn()).toBe(false);
});

it('refreshToken posts refresh_token', () => {
  localStorage.setItem(CONSTANTS.REFRESH_TOKEN, 'refresh-1');

  service.refreshToken().subscribe();

  const req = httpMock.expectOne('<refresh_token_url>');
  expect(req.request.method).toBe('POST');
  expect(req.request.body).toContain(`${CONSTANTS.REFRESH_TOKEN}=refresh-1`);
  req.flush({ access_token: 'access-2', refresh_token: 'refresh-2' });
});

it('logout clears storage and reloads on success', () => {
  localStorage.setItem('token', 'access-1');
  localStorage.setItem(CONSTANTS.REFRESH_TOKEN, 'refresh-1');

  service.logout();

  const req = httpMock.expectOne('<logout_URL>');
  req.flush({});

  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem(CONSTANTS.REFRESH_TOKEN)).toBeNull();
  expect(reloadSpy).toHaveBeenCalled();
});

it('logout clears storage and reloads on error', () => {
  localStorage.setItem('token', 'access-1');
  localStorage.setItem(CONSTANTS.REFRESH_TOKEN, 'refresh-1');

  service.logout();

  const req = httpMock.expectOne('<logout_URL>');
  req.flush('fail', { status: 500, statusText: 'Server Error' });

  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem(CONSTANTS.REFRESH_TOKEN)).toBeNull();
  expect(reloadSpy).toHaveBeenCalled();
});
