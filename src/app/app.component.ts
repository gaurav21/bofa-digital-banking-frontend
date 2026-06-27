import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BroadcasterService } from '@core/services/broadcaster.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy {
  $destroy: Subject<void> = new Subject();

  constructor(private _broadcatser: BroadcasterService) {
    this._broadcatser.broadcast('mykey', 'myvalue');
    localStorage.setItem('token', 'dummy');

    this._broadcatser
      .listen('mykey')
      .pipe(takeUntil(this.$destroy))
      .subscribe({
        next: (data) => console.log(data),
      });
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }
}
