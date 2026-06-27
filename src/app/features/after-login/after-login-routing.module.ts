import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

import { AfterLoginComponent } from './after-login.component';

const routes: Routes = [{ path: '', component: AfterLoginComponent, canActivate: [authGuard] }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AfterLoginRoutingModule {}
