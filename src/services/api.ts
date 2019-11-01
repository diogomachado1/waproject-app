import NetInfo from '@react-native-community/netinfo';
import axios, { AxiosError, AxiosInstance, Method } from 'axios';
import device from 'react-native-device-info';
import { from, Observable, of, ReplaySubject, throwError } from 'rxjs';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  first,
  map,
  sampleTime,
  shareReplay,
  switchMap
} from 'rxjs/operators';
import { API_ENDPOINT } from '~/config';
import { ApiError } from '~/errors/api';
import { NoInternetError } from '~/errors/noInternet';
import { apiResponseFormatter } from '~/formatters/apiResponse';
import { logError } from '~/helpers/rxjs-operators/logError';
import { IAuthToken } from '~/interfaces/authToken';

import tokenService from './token';

export class ApiService {
  private client: AxiosInstance;
  private connection$: ReplaySubject<boolean>;
  private tokenRefreshRequest: Observable<IAuthToken>;

  constructor() {
    this.connection$ = new ReplaySubject(1);
    this.client = axios.create({ baseURL: API_ENDPOINT, timeout: 30000 });

    this.watchNetwork();
  }

  public get<T = any>(url: string, params?: any): Observable<T> {
    return this.request('GET', url, params);
  }

  public post<T = any>(url: string, body: any): Observable<T> {
    return this.request('POST', url, body);
  }

  public delete<T = any>(url: string, params?: any): Observable<T> {
    return this.request('DELETE', url, params);
  }

  public connection(): Observable<boolean> {
    return this.connection$.pipe(distinctUntilChanged());
  }

  private request<T>(method: Method, url: string, data: any = null, isRetry: boolean = false): Observable<T> {
    return this.connection$.pipe(
      sampleTime(500),
      first(),
      map(connected => {
        if (!connected) throw new NoInternetError();
      }),
      switchMap(() => this.getBearerToken()),
      map(bearerToken => ({ Authorization: bearerToken })),
      switchMap(headers => {
        return this.client({
          url,
          method,
          headers: { 'Content-type': 'application/json', ...headers },
          params: method.toUpperCase() === 'GET' ? data : null,
          data: method.toUpperCase() === 'POST' ? data : null
        });
      }),
      map(response => apiResponseFormatter(response.data)),
      catchError(err => this.handleError(err, isRetry))
    );
  }

  private watchNetwork(): void {
    NetInfo.isConnected.fetch().then(isConnected => this.connection$.next(isConnected));
    NetInfo.isConnected.addEventListener('connectionChange', isConnected => {
      this.connection$.next(isConnected);
    });
  }

  private getBearerToken() {
    return tokenService.getTokens().pipe(
      combineLatest(tokenService.getUser()),
      first(),
      switchMap(([tokens, user]) => {
        if (!tokens || !user) return of(null);

        const now = (Date.now().valueOf() + 500) / 1000;
        if (!user.exp || user.exp > now) {
          return of(tokens.accessToken);
        }

        if (!this.tokenRefreshRequest) {
          this.tokenRefreshRequest = from(
            this.client.post('/auth/refresh', { deviceId: device.getUniqueId(), refreshToken: tokens.refreshToken })
          ).pipe(
            switchMap(response => tokenService.setTokens(response.data)),
            logError(),
            catchError(() => tokenService.clearToken().pipe(map(() => null))),
            shareReplay(1)
          );
        }

        return this.tokenRefreshRequest.pipe(map(({ accessToken }) => accessToken));
      }),
      map(accessToken => (accessToken ? `Bearer ${accessToken}` : null))
    );
  }

  private handleError(err: AxiosError, isRetry: boolean) {
    if (!err.config) {
      return throwError(err);
    }

    if (isRetry || !err.response) {
      return throwError(new ApiError(err.config, err.response, err));
    }

    return throwError(new ApiError(err.config, err.response, err));
  }
}

const apiService = new ApiService();
export default apiService;
