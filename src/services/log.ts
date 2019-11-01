import * as Sentry from '@sentry/react-native';
import firebase from 'react-native-firebase';
import { ENV, IS_DEV, SENTRY_DSN } from '~/config';
import { ApiError } from '~/errors/api';
import { IUserToken } from '~/interfaces/tokens/user';

export class LogService {
  constructor() {
    Sentry.init({ dsn: SENTRY_DSN, environment: ENV });
  }

  public setUser(user: IUserToken): void {
    if (!user) {
      Sentry.setUser({
        id: null,
        email: null,
        username: null,
        extra: {}
      });
      return;
    }

    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
      username: user.email,
      extra: { ...user }
    });
  }

  public breadcrumb(message: string, category: string = 'manual', data: any = {}): void {
    firebase.crashlytics().setStringValue(`breadcrumb-${category}-${Date.now()}`, message);
    firebase.crashlytics().setStringValue(`breadcrumb-${category}-${Date.now()}-data`, JSON.stringify(data));
    Sentry.addBreadcrumb({ message, category, data });
  }

  public handleError(err: any): void {
    if (!err) return;

    if (typeof err === 'string') {
      err = new Error(err);
    }

    if (['NETWORK_ERROR'].includes(err.message)) {
      return;
    }

    if (!IS_DEV && err.ignoreLog) {
      return;
    }

    Sentry.captureException(err);
    firebase.crashlytics().setStringValue('stack', err.stack);
    firebase.crashlytics().recordCustomError(err.name || 'Error', err.message);

    if (!IS_DEV) return;

    console.log(
      err instanceof ApiError
        ? err.metadata.request.url + ': ' + JSON.stringify(err.metadata.response.data, null, 2)
        : err
    );
    return;
  }
}

const logService = new LogService();
export default logService;
