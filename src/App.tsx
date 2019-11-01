import ConfigProvider, { ConfigBuilder } from '@react-form-fields/native-base/ConfigProvider';
import langConfig from '@react-form-fields/native-base/ConfigProvider/langs/pt-br';
import snakeCase from 'lodash/snakeCase';
import { Root, StyleProvider } from 'native-base';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import firebase from 'react-native-firebase';
import FlashMessage from 'react-native-flash-message';
import { MenuProvider } from 'react-native-popup-menu';
import { NavigationActions, NavigationState, StackActions } from 'react-navigation';
import { useObservable } from 'react-use-observable';
import { delay, filter, switchMap, tap } from 'rxjs/operators';
import Loader from '~/components/Shared/Loader';

import { variablesTheme } from './assets/theme';
import getTheme from './assets/theme/native-base-theme/components';
import Navigator from './components/Navigator';
import { InteractionManager } from './facades/interactionManager';
import Toast from './facades/toast';
import getCurrentRouteState from './helpers/currentRouteState';
import { setupServices } from './services';
import cacheService from './services/cache';
import logService from './services/log';
import tokenService from './services/token';

const theme = getTheme(variablesTheme);

const config = new ConfigBuilder()
  .fromLang(langConfig)
  .setValidationOn('onSubmit')
  .setIconProps({ type: 'MaterialCommunityIcons' }, 'chevron-down', 'magnify', 'close')
  .setItemProps({ floatingLabel: false })
  .setLoadingProps({ color: theme.variables.brandDark }, { marginRight: 10 })
  .build();

const App = memo(() => {
  const navigatorRef = useRef<Navigator>();
  const [currentScreen, setCurrentScreen] = useState<string>();

  useEffect(() => setupServices(navigatorRef.current as any), [navigatorRef]);

  useObservable(() => {
    return tokenService.getTokens().pipe(
      filter(tokens => !tokens),
      delay(1000),
      switchMap(() => InteractionManager.runAfterInteractions()),
      filter(() => currentScreen !== 'Login'),
      switchMap(() => cacheService.clear()),
      tap(() => {
        (navigatorRef.current as any).dispatch(
          StackActions.reset({
            index: 0,
            key: null,
            actions: [
              NavigationActions.navigate({
                routeName: 'Index',
                params: { logout: true },
                action: NavigationActions.navigate({ routeName: 'Index', params: { logout: true } })
              })
            ]
          })
        );
      }),
      tap(() => Toast.showError('Sessão inválida'))
    );
  }, [navigatorRef, currentScreen]);

  const onNavigationStateChange = useCallback((prevState: NavigationState, currentState: NavigationState) => {
    Keyboard.dismiss();

    if (!currentState || !currentState.routes || !currentState.routes.length || prevState === currentState) return;

    const route = getCurrentRouteState(currentState);

    setCurrentScreen(route.routeName);
    logService.breadcrumb(route.routeName, 'navigation', route.params);
    firebase.analytics().logEvent(snakeCase(`screen_${route.routeName}`));
  }, []);

  return (
    <StyleProvider style={theme}>
      <MenuProvider>
        <ConfigProvider value={config}>
          <Root>
            <Loader />
            <Navigator ref={navigatorRef as any} onNavigationStateChange={onNavigationStateChange} />
            <FlashMessage position='top' />
          </Root>
        </ConfigProvider>
      </MenuProvider>
    </StyleProvider>
  );
});

export default App;
