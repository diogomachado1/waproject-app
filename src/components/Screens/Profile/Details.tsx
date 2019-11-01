import { Body, Button, Container, Content, H2, Icon, Left, List, ListItem, Spinner, Text, View } from 'native-base';
import React, { memo, useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationEvents } from 'react-navigation';
import { useCallbackObservable, useRetryableObservable } from 'react-use-observable';
import { filter, switchMap } from 'rxjs/operators';
import { classes, variablesTheme } from '~/assets/theme';
import ErrorMessage from '~/components/Shared/ErrorMessage';
import Alert from '~/facades/alert';
import { loader } from '~/helpers/rxjs-operators/loader';
import { logError } from '~/helpers/rxjs-operators/logError';
import { IUseNavigation, useNavigation } from '~/hooks/useNavigation';
import userService from '~/services/user';

const ProfileScreen = memo((props: IUseNavigation) => {
  const navigation = useNavigation(props);

  const [user, error, , reload] = useRetryableObservable(() => {
    return userService.get().pipe(logError());
  }, []);

  const [logout] = useCallbackObservable(() => {
    return Alert.confirm('Confirmar', 'Deseja realmente sair?', 'Sim', 'Não').pipe(
      filter(ok => ok),
      switchMap(() => userService.logout().pipe(loader())),
      logError()
    );
  }, []);

  const navigateEdit = useCallback(() => navigation.navigate('UserEdit', { user }), [navigation, user]);
  const navigateLogin = useCallback(() => navigation.navigate('Login', { force: true }), [navigation]);

  useEffect(() => {
    navigation.setParam({ navigateEdit: user ? navigateEdit : null });
  }, [navigateEdit, navigation, user]);

  const loading = user === undefined && error === undefined;

  return (
    <Container>
      <NavigationEvents onWillFocus={reload} />

      <Content>
        {loading && <Spinner />}
        {!loading && !user && error && <ErrorMessage error={error} />}
        {!loading && !user && !error && (
          <View style={[classes.emptyMessage, classes.alignCenter]}>
            <Icon active name='contact' style={[styles.loginIcon, classes.iconLarge]} />
            <Text style={styles.loginText}>Ainda não te conhecemos, mas gostaríamos de saber mais sobre você!</Text>
            <Button block onPress={navigateLogin}>
              <Text>ENTRAR</Text>
            </Button>
          </View>
        )}
        {!loading && user && (
          <View>
            <View style={styles.header}>
              <Icon active name='contact' style={styles.avatarIcon} />
              <H2 style={styles.headerText}>{`${user.firstName} ${user.lastName}`}</H2>
            </View>
            <List>
              {!!user.email && (
                <ListItem style={[classes.listItem, styles.listItem]}>
                  <Left style={classes.listIconWrapper}>
                    <Icon active name='mail' style={classes.listIcon} />
                  </Left>
                  <Body>
                    <Text>{user.email}</Text>
                  </Body>
                </ListItem>
              )}
            </List>
            <Button block light style={styles.logoutButton} onPress={logout}>
              <Text>SAIR</Text>
            </Button>
          </View>
        )}
      </Content>
    </Container>
  );
});

ProfileScreen.navigationOptions = ({ navigation }) => {
  return {
    title: 'Perfil',
    headerLeft: () => (
      <Button style={classes.headerButton} onPress={navigation.toggleDrawer}>
        <Icon name='menu' />
      </Button>
    ),
    headerRight: navigation.getParam('navigateEdit') && (
      <Button style={classes.headerButton} onPress={navigation.getParam('navigateEdit')}>
        <Icon name='create' />
      </Button>
    ),
    drawerIcon: ({ tintColor }) => <Icon name='contact' style={{ color: tintColor }} />
  };
};

const styles = StyleSheet.create({
  loginIcon: {
    marginTop: 20,
    marginBottom: 10,
    color: variablesTheme.brandPrimary
  },
  loginText: {
    textAlign: 'center',
    marginBottom: 20
  },
  header: {
    backgroundColor: variablesTheme.brandPrimary,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerText: {
    color: 'white'
  },
  avatarIcon: {
    marginBottom: 10,
    color: 'white',
    fontSize: 100
  },
  listItem: {
    borderBottomWidth: 0
  },
  logoutButton: {
    margin: 16
  }
});

export default ProfileScreen;
