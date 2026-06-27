import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { BofaAccountCardComponent } from './bofa-account-card.component';

@NgModule({
  declarations: [BofaAccountCardComponent],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  exports: [BofaAccountCardComponent],
})
export class BofaAccountCardModule {}
