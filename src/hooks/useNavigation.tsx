import { useMemo } from 'react';
import { NavigationActions, NavigationInjectedProps, StackActions } from 'react-navigation';

export interface IUseNavigation extends Partial<NavigationInjectedProps> {}

export function useNavigation({ navigation }: IUseNavigation) {
  return useMemo(
    () => ({
      back() {
        navigation.goBack(null);
      },
      navigate(routeName: string, params: any = {}, reset: boolean = false) {
        if (!reset) {
          navigation.navigate(routeName, params);
          return;
        }

        navigation.dispatch(
          StackActions.reset({
            index: 0,
            key: null,
            actions: [
              NavigationActions.navigate({
                routeName,
                params,
                action: NavigationActions.navigate({ routeName, params })
              })
            ]
          })
        );
      },
      getParam(paramName: string) {
        return navigation.getParam(paramName);
      },
      setParam(params: Parameters<typeof navigation.setParams>[0]) {
        return navigation.setParams(params);
      }
    }),
    [navigation]
  );
}
