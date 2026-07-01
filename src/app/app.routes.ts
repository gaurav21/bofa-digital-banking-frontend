import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/after-login/after-login.component').then((m) => m.AfterLoginComponent),
    canActivate: [authGuard],
  },
  {
    path: 'after-login',
    loadComponent: () => import('./features/after-login/after-login.component').then((m) => m.AfterLoginComponent),
    canActivate: [authGuard],
  },
  {
    path: 'before-login',
    loadComponent: () => import('./features/before-login/before-login.component').then((m) => m.BeforeLoginComponent),
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./features/accounts/accounts-dashboard.component').then((m) => m.AccountsDashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'transfers',
    loadComponent: () => import('./features/transfers/transfer-form.component').then((m) => m.TransferFormComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'after-login',
  },
];
