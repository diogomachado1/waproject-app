import FieldText from '@react-form-fields/native-base/Text';
import ValidationContext, { IValidationContextRef } from '@react-form-fields/native-base/ValidationContext';
import { Button, Container, Icon, Text, View } from 'native-base';
import React, { memo, useCallback, useRef } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useCallbackObservable } from 'react-use-observable';
import { of, timer } from 'rxjs';
import { filter, first, switchMap, tap } from 'rxjs/operators';
import { classes } from '~/assets/theme';
import ButtonHeaderProfile from '~/components/Shared/ButtonHeaderProfile';
import KeyboardScrollContainer from '~/components/Shared/KeyboardScrollContainer';
import Toast from '~/facades/toast';
import { loader } from '~/helpers/rxjs-operators/loader';
import { logError } from '~/helpers/rxjs-operators/logError';
import useModel from '~/hooks/useModel';
import { IUseNavigation, useNavigation } from '~/hooks/useNavigation';
import { IOrder } from '~/interfaces/models/order';
import orderService from '~/services/order';

const OrderPage = memo((props: IUseNavigation) => {
  const [model, setModelProp] = useModel<IOrder>({});

  const navigation = useNavigation(props);

  const validationRef = useRef<IValidationContextRef>();

  const onCompleteLogin = useCallback(() => navigation.navigate('Home', null, true), [navigation]);

  const [handleSubmit] = useCallbackObservable(() => {
    const { description, amount, value } = model;
    return of(true).pipe(
      tap(() => Keyboard.dismiss()),
      switchMap(() => timer(500)),
      first(),
      switchMap(() => validationRef.current.isValid()),
      filter(isValid => {
        if (!isValid) Toast.showError('Verifique os campos obrigatórios');
        return isValid;
      }),
      switchMap(() => orderService.insert({ description, amount, value }).pipe(loader())),
      tap(() => onCompleteLogin(), err => Toast.showError(err)),
      logError()
    );
  }, [model, navigation, onCompleteLogin]);

  return (
    <Container>
      <KeyboardScrollContainer withSafeArea>
        <ValidationContext ref={validationRef}>
          <Animatable.View style={styles.viewContainer} animation='fadeInUp' useNativeDriver={true}>
            <FieldText
              leftIcon='cart'
              placeholder='Nome do produto'
              validation='required'
              autoCapitalize='none'
              flowIndex={1}
              marginBottom
              hideErrorMessage
              value={model.description}
              onChange={setModelProp('description', (model, value) => (model.description = value))}
            />

            <FieldText
              leftIcon='currency-brl'
              placeholder='Valor'
              keyboardType='numeric'
              validation='required'
              flowIndex={2}
              marginBottom
              hideErrorMessage
              value={model.value}
              onChange={setModelProp('value', (model, value) => (model.value = value))}
            />
            <FieldText
              leftIcon='clipboard'
              placeholder='Quantidade'
              keyboardType='numeric'
              validation='required'
              flowIndex={3}
              marginBottom
              hideErrorMessage
              value={model.amount}
              onChange={setModelProp('amount', (model, value) => (model.amount = value))}
              onSubmitEditing={handleSubmit}
            />
            <View style={styles.addContainer}>
              <Button onPress={handleSubmit} success block style={styles.buttons}>
                <Text>Adicionar</Text>
              </Button>
            </View>
          </Animatable.View>
        </ValidationContext>
      </KeyboardScrollContainer>
    </Container>
  );
});

OrderPage.navigationOptions = ({ navigation }) => {
  return {
    title: 'Adicionar um pedido',
    tabBarLabel: 'Adicionar um pedido',
    headerLeft: () => (
      <Button style={classes.headerButton} onPress={navigation.openDrawer}>
        <Icon name='menu' style={classes.headerButtonIcon} />
      </Button>
    ),

    headerRight: <ButtonHeaderProfile />,
    drawerIcon: ({ tintColor }) => <Icon name='md-add-circle' style={{ color: tintColor }} />
  };
};

const styles = StyleSheet.create({
  viewContainer: {
    flex: 1
  },
  buttons: {
    marginTop: 16
  },
  addContainer: {
    marginTop: 'auto',
    flex: 1,
    flexGrow: 0,
    flexShrink: 0
  }
});

export default OrderPage;
