import { createDrawerNavigator } from 'react-navigation-drawer';
import { variablesTheme } from '~/assets/theme';
import HomePage from '~/components/Screens/Home';
import ProfilePage from '~/components/Screens/Profile/Details';

import Drawer from '../Shared/Drawer';

export const HomeDrawerScreens: any = {
  Home: { screen: HomePage },
  Profile: { screen: ProfilePage }
};

const HomeDrawerNavigator = createDrawerNavigator(HomeDrawerScreens, {
  initialRouteName: 'Home',
  contentComponent: Drawer as any,
  contentOptions: {
    activeTintColor: variablesTheme.brandPrimary
  }
});

export default HomeDrawerNavigator;
