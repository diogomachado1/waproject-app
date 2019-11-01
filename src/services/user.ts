import device from 'react-native-device-info';
import { Observable, of } from 'rxjs';
import { distinctUntilChanged, first, map, switchMap } from 'rxjs/operators';
import cache, { cacheClean } from '~/helpers/rxjs-operators/cache';
import { IUser } from '~/interfaces/models/user';
import { IUserToken } from '~/interfaces/tokens/user';

import apiService, { ApiService } from './api';
import cacheService, { CacheService } from './cache';
import notificationService, { NotificationService } from './notification';
import tokenService, { TokenService } from './token';

export class UserService {
  constructor(
    private apiService: ApiService,
    private cacheService: CacheService,
    private notificationService: NotificationService,
    private tokenService: TokenService
  ) {}

  public login(email: string, password: string): Observable<void> {
    return this.getDeviceInformation().pipe(
      switchMap(({ deviceId, deviceName, notificationToken }) => {
        return this.apiService.post('/auth/login', {
          email,
          password,
          deviceId,
          deviceName,
          notificationToken
        });
      }),
      switchMap(tokens => this.tokenService.setTokens(tokens)),
      map(() => null)
    );
  }

  public get(refresh?: boolean): Observable<IUser> {
    return this.tokenService.getTokens().pipe(
      switchMap(token => {
        if (!token) {
          return of(null);
        }

        return this.apiService.get<IUser>('profile').pipe(cache('service-profile', { refresh }));
      })
    );
  }

  public save(model: IUser): Observable<IUser> {
    return this.apiService.post<IUser>('profile', model).pipe(cacheClean('service-profile'));
  }

  public isLogged(): Observable<boolean> {
    return this.userChanged().pipe(map(t => !!t));
  }

  public userChanged(): Observable<IUserToken> {
    return this.tokenService
      .getUser()
      .pipe(distinctUntilChanged((n, o) => (n || { id: null }).id === (o || { id: null }).id));
  }

  public logout(): Observable<void> {
    return this.apiService.post('/auth/logout', { deviceId: device.getUniqueId() }).pipe(
      switchMap(() => this.tokenService.clearToken()),
      switchMap(() => this.cacheService.clear())
    );
  }

  public updateSession(notificationToken: string): Observable<void> {
    return this.getDeviceInformation().pipe(
      switchMap(({ deviceId, deviceName }) => {
        return this.apiService.post('/auth/opened', { deviceId, deviceName, notificationToken });
      })
    );
  }

  private getDeviceInformation(): Observable<{ deviceId: string; deviceName: string; notificationToken: string }> {
    return this.notificationService.getToken().pipe(
      first(),
      switchMap(async notificationToken => {
        const [deviceId, brand, model, systemName, systemVersion] = await Promise.all([
          device.getUniqueId(),
          device.getBrand(),
          device.getModel(),
          device.getSystemName(),
          device.getSystemVersion()
        ]);

        return {
          deviceId,
          deviceName: `${brand} - ${model} (${systemName} ${systemVersion})`,
          notificationToken
        };
      })
    );
  }
}

const userService = new UserService(apiService, cacheService, notificationService, tokenService);
export default userService;
