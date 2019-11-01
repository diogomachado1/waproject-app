import FieldText from '@react-form-fields/native-base/Text';
import ValidationContext, { IValidationContextRef } from '@react-form-fields/native-base/ValidationContext';
import { Button, Card, Text } from 'native-base';
import React, { memo, useCallback, useRef } from 'react';
import { Dimensions, Image, ImageBackground, Keyboard, StatusBar, StyleSheet, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useCallbackObservable } from 'react-use-observable';
import { of, timer } from 'rxjs';
import { filter, first, switchMap, tap } from 'rxjs/operators';
import background from '~/assets/images/background.jpg';
import logo from '~/assets/images/logo.png';
import { variablesTheme } from '~/assets/theme';
import KeyboardScrollContainer from '~/components/Shared/KeyboardScrollContainer';
import Toast from '~/facades/toast';
import { loader } from '~/helpers/rxjs-operators/loader';
import { logError } from '~/helpers/rxjs-operators/logError';
import useModel from '~/hooks/useModel';
import { IUseNavigation, useNavigation } from '~/hooks/useNavigation';
import userService from '~/services/user';

const LoginScreen = memo((props: IUseNavigation) => {
  const [model, setModelProp] = useModel<{ email: string; password: string }>({});

  const navigation = useNavigation(props);
  const validationRef = useRef<IValidationContextRef>();

  const onCompleteLogin = useCallback(() => navigation.navigate('Home', null, true), [navigation]);

  const [handleLogin] = useCallbackObservable(() => {
    const { email, password } = model;

    return of(true).pipe(
      tap(() => Keyboard.dismiss()),
      switchMap(() => timer(500)),
      first(),
      switchMap(() => validationRef.current.isValid()),
      filter(isValid => {
        if (!isValid) Toast.showError('Verifique os campos obrigatórios');
        return isValid;
      }),
      switchMap(() => userService.login(email, password).pipe(loader())),
      tap(() => onCompleteLogin(), err => Toast.showError(err)),
      logError()
    );
  }, [model, navigation, onCompleteLogin]);

  return (
    <View style={styles.container}>
      <ImageBackground source={background} style={styles.background}>
        <KeyboardScrollContainer withSafeArea>
          <StatusBar barStyle='light-content' backgroundColor='#000000' />

          <ValidationContext ref={validationRef}>
            <Animatable.View style={styles.viewContainer} animation='fadeInUp' useNativeDriver={true}>
              <Image source={logo} style={styles.img} resizeMode='contain' />

              <Card style={styles.formContainer}>
                <FieldText
                  leftIcon='email'
                  placeholder='Email'
                  value={model.email}
                  keyboardType='email-address'
                  validation='required|email'
                  autoCapitalize='none'
                  flowIndex={1}
                  marginBottom
                  hideErrorMessage
                  onChange={setModelProp('email', (model, value) => (model.email = value))}
                />

                <FieldText
                  leftIcon='lock'
                  placeholder='Senha'
                  value={model.password}
                  secureTextEntry={true}
                  validation='required'
                  flowIndex={2}
                  marginBottom
                  hideErrorMessage
                  onChange={setModelProp('password', (model, value) => (model.password = value))}
                  onSubmitEditing={handleLogin}
                />
              </Card>

              <View style={styles.registerContainer}>
                <Button onPress={handleLogin} success block style={styles.buttons}>
                  <Text>Entrar</Text>
                </Button>
              </View>
            </Animatable.View>
          </ValidationContext>
        </KeyboardScrollContainer>
      </ImageBackground>
    </View>
  );
});

LoginScreen.navigationOptions = () => {
  return {
    header: null
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: variablesTheme.deviceHeight,
    width: variablesTheme.deviceWidth
  },
  viewContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  img: {
    marginBottom: 50,
    marginTop: -50,
    alignSelf: 'center',
    height: 150,
    width: 200,
    maxWidth: Dimensions.get('screen').width - 50
  },
  buttons: {
    marginTop: 16
  },
  formContainer: {
    padding: 20,
    width: variablesTheme.deviceWidth * 0.8,
    flexShrink: 0
  },
  registerContainer: {
    flex: 1,
    flexGrow: 0,
    flexShrink: 0
  },
  text: {
    fontWeight: '600',
    fontSize: 17
  }
});

export default LoginScreen;
