import { BehaviorSubject } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { BofaNavHeaderModule } from './bofa-nav-header.module';
import { BofaNavHeaderComponent } from './bofa-nav-header.component';
import { SsoAuthService } from '../../../core/auth/sso.service';

class MockSsoAuthService {
  authState$ = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.authState$.asObservable();
}

describe('BofaNavHeaderComponent', () => {
  let fixture: ComponentFixture<BofaNavHeaderComponent>;
  let component: BofaNavHeaderComponent;
  let mockAuth: MockSsoAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BofaNavHeaderModule, RouterTestingModule, BrowserAnimationsModule],
      providers: [{ provide: SsoAuthService, useClass: MockSsoAuthService }],
    });

    mockAuth = TestBed.inject(SsoAuthService) as unknown as MockSsoAuthService;
    fixture = TestBed.createComponent(BofaNavHeaderComponent);
    component = fixture.componentInstance;
    component.notificationCount = 7;
    fixture.detectChanges();
  });

  it('shows only the menu button when unauthenticated', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
    expect(buttons.length).toBe(1);
  });

  it('shows notification and user controls when authenticated', () => {
    mockAuth.authState$.next(true);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
    expect(buttons.length).toBe(3);

    const badge = fixture.nativeElement.querySelector('.mat-badge-content');
    expect(badge.textContent.trim()).toBe('7');
  });

  it('emits outputs for menu toggle and logout', () => {
    const menuSpy = jest.fn();
    const logoutSpy = jest.fn();
    component.onMenuToggle.subscribe(menuSpy);
    component.onLogout.subscribe(logoutSpy);

    component.onMenuToggle.emit();
    component.onLogout.emit();

    expect(menuSpy).toHaveBeenCalled();
    expect(logoutSpy).toHaveBeenCalled();
  });
});
