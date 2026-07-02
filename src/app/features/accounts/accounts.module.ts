import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AccountsRoutingModule } from './accounts-routing.module';
import { AccountsDashboardComponent } from './accounts-dashboard.component';
import { BofaAccountCardModule } from '../../shared/components/bofa-account-card/bofa-account-card.module';
import { BofaTransactionTableModule } from '../../shared/components/bofa-transaction-table/bofa-transaction-table.module';

@NgModule({
  declarations: [AccountsDashboardComponent],
  imports: [
    CommonModule,
    AccountsRoutingModule,
    MatProgressSpinnerModule,
    BofaAccountCardModule,
    BofaTransactionTableModule,
  ],
})
export class AccountsModule {}
