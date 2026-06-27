import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { BofaTransactionTableComponent } from './bofa-transaction-table.component';

@NgModule({
  declarations: [BofaTransactionTableComponent],
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule],
  exports: [BofaTransactionTableComponent],
})
export class BofaTransactionTableModule {}
