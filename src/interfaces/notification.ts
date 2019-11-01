import { Notification } from 'react-native-firebase/notifications';
import { NavigationDispatch } from 'react-navigation';

export interface INotification extends Notification {
  data: INotificationData;
}

export interface INotificationData {
  action?: string;
  userId?: string;
  [key: string]: any;
}

export interface INotificationHandler {
  (notification: INotificationData, dispatch: NavigationDispatch, appStarted: boolean): Promise<boolean>;
}
