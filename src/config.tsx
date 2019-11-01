import { Platform } from 'react-native';
import { ENV_API_ENDPOINT, ENV_SENTRY_DSN } from 'react-native-dotenv';

export const ENV = __DEV__ ? 'development' : 'production';
export const IS_DEV = ENV === 'development';

export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

export const SNACKBAR_TIMEOUT = 3000;
export const SENTRY_DSN = ENV_SENTRY_DSN;
export const API_ENDPOINT = ENV_API_ENDPOINT;
