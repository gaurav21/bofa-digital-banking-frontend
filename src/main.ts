import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { HTTPReqResInterceptor } from './app/core/services/http-req-res.interceptor';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
  if (window) {
    selfXSSWarning();
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: 'BASE_URL', useValue: environment.baseurl },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HTTPReqResInterceptor,
      multi: true,
    },
  ],
}).catch((err) => console.error(err));

function selfXSSWarning() {
  setTimeout(() => {
    console.log('%c!!! STOP !!!', 'font-weight:bold; font: 6em Arial; color: red; ');
    console.log(
      `\n%cThis is a browser feature intended for developers. Using this console may allow\
     attackers to impersonate you and steal your information using an attack called Self-XSS.\
     Do not enter or paste code that you do not understand.`,
      'font-weight:bold; font: 3em Arial; color: red;',
    );
  });
}
