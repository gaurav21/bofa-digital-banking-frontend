import { Component } from '@angular/core';
import { ScamComponent } from '@shared/components/scam/scam.component';

@Component({
  selector: 'app-after-login',
  standalone: true,
  imports: [ScamComponent],
  templateUrl: './after-login.component.html',
  styleUrls: ['./after-login.component.scss'],
})
export class AfterLoginComponent {}
