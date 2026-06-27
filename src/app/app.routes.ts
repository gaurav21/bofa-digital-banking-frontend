import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/after-login/after-login.component').then((m) => m.AfterLoginComponent),
  },
  {
    path: 'after-login',
    loadComponent: () => import('./features/after-login/after-login.component').then((m) => m.AfterLoginComponent),
  },
  {
    path: 'before-login',
    loadComponent: () => import('./features/before-login/before-login.component').then((m) => m.BeforeLoginComponent),
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./features/accounts/accounts-dashboard.component').then((m) => m.AccountsDashboardComponent),
  },
  {
    path: 'transfers',
    loadComponent: () => import('./features/transfers/transfer-form.component').then((m) => m.TransferFormComponent),
  },
  {
    path: '**',
    redirectTo: 'after-login',
  },
];
