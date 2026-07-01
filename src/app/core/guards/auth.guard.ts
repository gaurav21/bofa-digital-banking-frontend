import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn();
};
