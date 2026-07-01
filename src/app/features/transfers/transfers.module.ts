import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { TransfersRoutingModule } from './transfers-routing.module';
import { TransferFormComponent } from './transfer-form.component';

@NgModule({
  declarations: [TransferFormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,  // Deprecated: should use provideHttpClient() in Angular 18
    TransfersRoutingModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class TransfersModule { }
