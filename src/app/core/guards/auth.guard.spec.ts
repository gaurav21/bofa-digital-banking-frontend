import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from '@core/services/auth.service';

let guard: AuthGuard;

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [AuthGuard], imports: [HttpClientTestingModule] });
});

it('should create', () => {
  guard = TestBed.inject(AuthGuard);
  expect(guard).toBeTruthy();
});

it('returns true when a token exists and false when it does not', () => {
  // This guard only checks token presence; there is no role-based branch in source.
  const authService = TestBed.inject(AuthService);
  guard = TestBed.inject(AuthGuard);

  localStorage.setItem('token', 'access-token');
  expect(guard.canActivate({} as any, {} as any)).toBe(true);

  localStorage.removeItem('token');
  expect(guard.canActivate({} as any, {} as any)).toBe(false);

  expect(authService.isLoggedIn()).toBe(false);
});
