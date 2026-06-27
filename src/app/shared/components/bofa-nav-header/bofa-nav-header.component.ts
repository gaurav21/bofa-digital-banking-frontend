import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SsoAuthService, BofAUserSession } from '../../../core/auth/sso.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'bofa-nav-header',
  template: `
    <mat-toolbar color="primary" class="bofa-nav-header">
      <button mat-icon-button (click)="menuToggle.emit()">
        <mat-icon>menu</mat-icon>
      </button>

      <img src="assets/bofa-logo-white.svg" alt="Bank of America" class="bofa-logo" height="28" />

      <span class="nav-spacer"></span>

      <nav mat-tab-nav-bar class="bofa-main-nav" [tabPanel]="tabPanel">
        <a
          mat-tab-link
          *ngFor="let link of navLinks"
          [routerLink]="link.path"
          routerLinkActive
          #rla="routerLinkActive"
          [active]="rla.isActive"
        >
          {{ link.label }}
        </a>
      </nav>
      <mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>

      <span class="nav-spacer"></span>

      <button mat-icon-button [matMenuTriggerFor]="notifMenu" *ngIf="isAuthenticated$ | async">
        <mat-icon [matBadge]="notificationCount" matBadgeColor="warn">notifications</mat-icon>
      </button>
      <mat-menu #notifMenu="matMenu">
        <button mat-menu-item>No new notifications</button>
      </mat-menu>

      <button mat-icon-button [matMenuTriggerFor]="userMenu" *ngIf="isAuthenticated$ | async">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item routerLink="/profile">Profile & Settings</button>
        <button mat-menu-item routerLink="/security">Security Center</button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout.emit()">Sign Out</button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [
    `
      .bofa-nav-header {
        background: #012169;
      }
      .bofa-logo {
        margin: 0 16px;
      }
      .nav-spacer {
        flex: 1 1 auto;
      }
      .bofa-main-nav {
        margin: 0 24px;
      }
    `,
  ],
})
export class BofaNavHeaderComponent {
  @Input() notificationCount = 0;
  @Output() menuToggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  isAuthenticated$: Observable<boolean>;

  navLinks = [
    { path: '/accounts', label: 'Accounts' },
    { path: '/transfers', label: 'Transfers & Payments' },
    { path: '/cards', label: 'Credit Cards' },
    { path: '/investments', label: 'Investments' },
  ];

  constructor(private authService: SsoAuthService) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }
}
