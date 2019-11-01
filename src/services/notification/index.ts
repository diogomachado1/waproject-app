import SplashScreen from 'react-native-splash-screen';
import { NavigationScreenProp } from 'react-navigation';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, filter, first, map, sampleTime, switchMap, tap } from 'rxjs/operators';
import { logError } from '~/helpers/rxjs-operators/logError';
import { INotification, INotificationHandler } from '~/interfaces/notification';

import { appReady } from '../';
import tokenService, { TokenService } from '../token';
import firebaseService, { FirebaseService } from './firebase';
import { register } from './handlers/register';

export class NotificationService {
  private navigator: NavigationScreenProp<any>;

  private token$: ReplaySubject<string>;
  private hasInitialNotification$: ReplaySubject<boolean>;
  private newNotification$: Subject<INotification>;

  private handlers: INotificationHandler[] = [];

  constructor(private tokenService: TokenService, private firebaseService: FirebaseService) {
    this.token$ = new ReplaySubject(1);
    this.newNotification$ = new Subject();
    this.hasInitialNotification$ = new ReplaySubject(1);

    this.firebaseService
      .onTokenRefresh()
      .pipe(logError())
      .subscribe(token => this.token$.next(token));

    this.firebaseService
      .onNewNotification()
      .pipe(
        switchMap(n => this.received(n.notification, n.initial, n.opened)),
        logError()
      )
      .subscribe(() => {}, () => {});
  }

  public setup(navigator: NavigationScreenProp<any>): void {
    this.navigator = navigator;
    register(this);
  }

  public getToken(): Observable<string> {
    return this.token$.pipe(
      distinctUntilChanged(),
      sampleTime(500)
    );
  }

  public hasInitialNotification(): Observable<boolean> {
    return this.hasInitialNotification$.asObservable();
  }

  public onNotification(): Observable<{ action?: string; data?: any }> {
    return this.newNotification$.asObservable();
  }

  public registerHandler(handler: INotificationHandler): void {
    this.handlers.push(handler);
  }

  private received(notification: INotification, appStarted: boolean, opened: boolean): Observable<boolean> {
    return this.checkNotification(notification).pipe(
      tap(valid => {
        if (!appStarted) return;
        this.hasInitialNotification$.next(valid);
      }),
      filter(valid => valid),
      tap(() => this.newNotification$.next(notification)),
      switchMap(() => {
        return opened || appStarted
          ? this.execNotification(notification, appStarted)
          : this.firebaseService.createLocalNotification(notification);
      }),
      tap(() => SplashScreen.hide())
    );
  }

  private checkNotification(notification: INotification): Observable<boolean> {
    if (!notification) {
      return of(false);
    }

    if (!notification.data || !notification.data.eduzzId) {
      return of(true);
    }

    return this.tokenService.getUser().pipe(
      first(),
      map(user => {
        if (!user) return false;
        return Number(notification.data.userId) == user.id;
      })
    );
  }

  private execNotification(notification: INotification, appStarted: boolean = false): Observable<boolean> {
    return appReady().pipe(
      switchMap(async () => {
        const { dispatch } = this.navigator;

        for (const handler of this.handlers) {
          const resolved = await handler(notification.data, dispatch, appStarted);
          if (resolved) return true;
        }

        return false;
      })
    );
  }
}

const notificationService = new NotificationService(tokenService, firebaseService);
export default notificationService;
