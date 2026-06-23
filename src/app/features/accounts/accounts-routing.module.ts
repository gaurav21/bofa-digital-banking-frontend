import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountsDashboardComponent } from './accounts-dashboard.component';

const routes: Routes = [
  { path: '', component: AccountsDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountsRoutingModule { }
