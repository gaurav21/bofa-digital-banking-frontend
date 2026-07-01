import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';

import { Inject, Injectable } from '@angular/core';
import { AuthToken } from '@core/models/auth.model';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { BroadcasterService } from './broadcaster.service';
import { CONSTANTS } from './constants';

@Injectable()
export class HTTPReqResInterceptor implements HttpInterceptor {
  isalreadyRefreshing: boolean = false;
  private tokenSubject: BehaviorSubject<AuthToken | null> = new BehaviorSubject<AuthToken | null>(null);

  constructor(
    @Inject('BASE_URL') private _baseUrl: string,
    private _broadcaster: BroadcasterService,
    private _authservice: AuthService,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this._broadcaster.broadcast(CONSTANTS.SHOW_LOADER, true);
    const newReq = req.clone({
      url: this._baseUrl + req.url,
      headers: req.headers.set('custom_header', 'value'),
    });

    return next.handle(newReq).pipe(
      tap((e) => {
        if (e instanceof HttpResponse) {
          this.handleSuccess(e.body);
        }
      }),
      catchError((err) => this.handleError(newReq, next, err)),
      finalize(() => {
        this._broadcaster.broadcast(CONSTANTS.SHOW_LOADER, false);
      }),
    );
  }

  handleError(newRequest: HttpRequest<unknown>, next: HttpHandler, err: unknown) {
    if (err instanceof HttpErrorResponse && err.status === 401) {
      return this.handle401(newRequest, next);
    } else {
      this._broadcaster.broadcast(CONSTANTS.ERROR, {
        error: 'Something went wrong',
        timeout: 5000,
      });
    }
    return throwError(() => err);
  }

  handleSuccess(body: unknown) {
    /* handle success actions here */
  }

  addToken(request: HttpRequest<unknown>, newToken: AuthToken) {
    return request.clone({
      headers: request.headers.set(CONSTANTS.AUTH_HEADER, `Bearer ${newToken.access_token}`),
    });
  }

  handle401(request: HttpRequest<unknown>, next: HttpHandler) {
    if (!this.isalreadyRefreshing) {
      this.isalreadyRefreshing = true;
      this.tokenSubject.next(null);
      return this._authservice.refreshToken().pipe(
        switchMap((newToken: AuthToken) => {
          if (newToken) {
            this._authservice.storeToken(newToken);
            this.tokenSubject.next(newToken);
            return next.handle(this.addToken(request, newToken));
          }
          this._authservice.logout();
          return throwError(() => new Error('no refresh token found'));
        }),
        catchError((error) => {
          this._authservice.logout();
          return throwError(() => error);
        }),
        finalize(() => (this.isalreadyRefreshing = false)),
      );
    } else {
      if (this.isalreadyRefreshing && request.url.includes('refresh')) {
        this._authservice.logout();
      }
      return this.tokenSubject.pipe(
        filter((token): token is AuthToken => token != null),
        take(1),
        switchMap((token: AuthToken) => {
          return next.handle(this.addToken(request, token));
        }),
      );
    }
  }
}
