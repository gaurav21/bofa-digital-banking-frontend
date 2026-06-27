import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

let service: AuthService;

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
  });
});

it('should create', () => {
  service = TestBed.inject(AuthService);
  expect(service).toBeTruthy();
});
