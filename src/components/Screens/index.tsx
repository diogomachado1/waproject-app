import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { useObservable } from 'react-use-observable';
import { filter, first, switchMap, tap } from 'rxjs/operators';
import { IS_DEV } from '~/config';
import { logError } from '~/helpers/rxjs-operators/logError';
import { IUseNavigation, useNavigation } from '~/hooks/useNavigation';
import { appDefaultNavigation, appOpened } from '~/services';
import tokenService from '~/services/token';

const IndexPage = memo((props: IUseNavigation) => {
  const navigation = useNavigation(props);

  useEffect(() => {
    appOpened();
  }, []);

  useObservable(() => {
    if (IS_DEV) SplashScreen.hide();

    return appDefaultNavigation().pipe(
      first(),
      filter(ok => ok),
      switchMap(() => tokenService.isAuthenticated()),
      tap(isAuthenticated => {
        setTimeout(() => SplashScreen.hide(), 500);

        navigation.navigate(isAuthenticated ? 'Home' : 'Login', null, true);
      }),
      logError()
    );
  }, []);

  return <View />;
});

IndexPage.navigationOptions = () => {
  return {
    header: null
  };
};

export default IndexPage;
