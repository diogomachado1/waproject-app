import * as base64 from 'base-64';
import { Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';
import storageService, { StorageService } from '~/facades/storage';
import { logError } from '~/helpers/rxjs-operators/logError';
import { IAuthToken } from '~/interfaces/authToken';
import { enRoles } from '~/interfaces/models/user';
import { IUserToken } from '~/interfaces/tokens/user';

export class TokenService {
  private tokens: IAuthToken;
  private authToken$: ReplaySubject<IAuthToken>;

  constructor(private storageService: StorageService) {
    this.authToken$ = new ReplaySubject(1);

    this.storageService
      .get('authToken')
      .pipe(logError())
      .subscribe(tokens => {
        this.tokens = tokens;
        this.authToken$.next(tokens);
      });
  }

  public getTokens(): Observable<IAuthToken> {
    return this.authToken$.pipe(distinctUntilChanged());
  }

  public getUser(): Observable<IUserToken> {
    return this.getTokens().pipe(
      map(tokens => (tokens ? tokens.accessToken : null)),
      distinctUntilChanged(),
      map(accessToken => {
        if (!accessToken) return;

        const user: IUserToken = JSON.parse(base64.decode(accessToken.split('.')[1]));

        user.fullName = `${user.firstName} ${user.lastName}`;
        user.canAccess = (...roles: enRoles[]) => {
          if (!roles || roles.length === 0) {
            return true;
          }

          if (roles.includes(enRoles.sysAdmin) && !user.roles.includes(enRoles.sysAdmin)) {
            return false;
          }

          if (user.roles.some(r => ['sysAdmin', 'admin'].includes(r))) {
            return true;
          }

          return roles.some(r => user.roles.includes(r));
        };

        return user;
      }),
      shareReplay(1)
    );
  }

  public setTokens(tokens: IAuthToken): Observable<IAuthToken> {
    return this.storageService.set('authToken', tokens).pipe(
      map(() => {
        this.tokens = tokens;
        this.authToken$.next(tokens);
        return tokens;
      })
    );
  }

  public clearToken(): Observable<void> {
    return this.setTokens(null).pipe(map(() => null));
  }

  public setAccessToken(accessToken: string): Observable<void> {
    this.tokens.accessToken = accessToken;

    return this.storageService.set('authToken', this.tokens).pipe(
      map(() => {
        this.authToken$.next(this.tokens);
      })
    );
  }

  public isAuthenticated(): Observable<boolean> {
    return this.getTokens().pipe(
      map(token => !!token),
      distinctUntilChanged()
    );
  }
}

const tokenService = new TokenService(storageService);
export default tokenService;
