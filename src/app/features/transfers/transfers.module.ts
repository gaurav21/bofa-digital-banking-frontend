import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
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
