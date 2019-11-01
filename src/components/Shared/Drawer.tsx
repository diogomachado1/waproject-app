import React, { memo } from 'react';
import { ScrollView } from 'react-native';
import { DrawerNavigatorItems } from 'react-navigation-drawer';
import { DrawerNavigatorItemsProps } from 'react-navigation-drawer/lib/typescript/src/types';

const Drawer = memo((props: DrawerNavigatorItemsProps) => {
  return (
    <ScrollView>
      <DrawerNavigatorItems {...(props as any)} />
    </ScrollView>
  );
});

export default Drawer;
