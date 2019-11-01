import firebase, { RNFirebase } from 'react-native-firebase';
import { Observable, of, ReplaySubject } from 'rxjs';
import { filter, first, switchMap, tap } from 'rxjs/operators';
import { variablesTheme } from '~/assets/theme';
import { IS_ANDROID, IS_DEV, IS_IOS } from '~/config';
import { logError } from '~/helpers/rxjs-operators/logError';
import { INotification } from '~/interfaces/notification';

import tokenService from '../token';

export class FirebaseService {
  private token$: ReplaySubject<string>;
  private notification$: ReplaySubject<{ notification: INotification; initial: boolean; opened: boolean }>;

  constructor() {
    this.token$ = new ReplaySubject(1);
    this.notification$ = new ReplaySubject(1);

    firebase
      .messaging()
      .hasPermission()
      .then(hasPermission => {
        if (hasPermission) return;

        return tokenService
          .isAuthenticated()
          .pipe(
            filter(isAuthenticated => isAuthenticated),
            first(),
            switchMap(() => firebase.messaging().requestPermission()),
            logError()
          )
          .subscribe(() => {}, () => {});
      });

    firebase.messaging().onTokenRefresh(token => this.token$.next(token));
    firebase
      .messaging()
      .getToken()
      .then(token => this.token$.next(token));

    firebase
      .notifications()
      .getInitialNotification()
      .then(n => {
        console.log('INITIAL: ' + n);
        this.notificationCallback(true, true)(n && n.notification);
      });

    firebase.notifications().onNotification(this.notificationCallback(false, false));
    firebase.notifications().onNotificationOpened(n => this.notificationCallback(false, true)(n.notification));

    this.token$
      .pipe(
        tap(() => firebase.messaging().subscribeToTopic('all')),
        tap(() => IS_DEV && firebase.messaging().subscribeToTopic('app-development')),
        logError()
      )
      .subscribe(() => {}, () => {});
  }

  public async testLocalNotification(): Promise<void> {
    const notification = new firebase.notifications.Notification()
      .setTitle('Test Local')
      .setBody('Hey this is the body sound6')
      .setSound('sound6.wav');

    return firebase.notifications().displayNotification(notification);
  }

  public onTokenRefresh(): Observable<string> {
    return this.token$.asObservable();
  }

  public onNewNotification(): Observable<{ notification: INotification; initial: boolean; opened: boolean }> {
    return this.notification$.asObservable();
  }

  public createLocalNotification(notification: INotification): Observable<boolean> {
    const sound: any = JSON.parse(notification.data.sound || '{}') || {};

    let newNotification = new firebase.notifications.Notification()
      .setTitle(notification.title || 'Eduzz')
      .setNotificationId(notification.notificationId)
      .setBody(notification.body)
      .setData(notification.data)
      .setSound(notification.sound || sound[IS_IOS ? 'ios' : 'android'] || 'default');

    if (IS_ANDROID) {
      newNotification = newNotification.android
        .setChannelId(notification.android.channelId || notification.data.android_channel_id || 'default')
        .android.setSmallIcon('@mipmap/ic_notification')
        .android.setColor(variablesTheme.brandPrimary);
    }

    return of(true).pipe(
      switchMap(() => {
        return firebase
          .notifications()
          .displayNotification(newNotification)
          .then(() => true)
          .catch(err => console.error(err) as any);
      })
    );
  }

  public async createChannel(
    id: string,
    name: string,
    sound: string = 'default',
    priority: RNFirebase.notifications.Android.Importance = firebase.notifications.Android.Importance.High
  ) {
    if (IS_IOS) return;

    const channel = new firebase.notifications.Android.Channel(id, name, priority).setSound(sound);
    await firebase.notifications().android.createChannel(channel);
  }

  private notificationCallback(initial: boolean, opened: boolean): any {
    return (notification: INotification) => {
      if (!notification && initial) {
        this.notification$.next({ notification: null, initial, opened });
        return;
      }

      this.notification$.next({ notification, initial, opened });
    };
  }
}

const firebaseService = new FirebaseService();
export default firebaseService;
