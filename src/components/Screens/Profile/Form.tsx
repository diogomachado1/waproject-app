import FieldText from '@react-form-fields/native-base/Text';
import ValidationContext, { IValidationContextRef } from '@react-form-fields/native-base/ValidationContext';
import { Button, Container, Content, Form, Icon, List } from 'native-base';
import React, { memo, useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { useCallbackObservable } from 'react-use-observable';
import { of, timer } from 'rxjs';
import { filter, first, switchMap, tap } from 'rxjs/operators';
import { classes } from '~/assets/theme';
import Toast from '~/facades/toast';
import { loader } from '~/helpers/rxjs-operators/loader';
import { logError } from '~/helpers/rxjs-operators/logError';
import useModel from '~/hooks/useModel';
import { IUseNavigation, useNavigation } from '~/hooks/useNavigation';
import { IUser } from '~/interfaces/models/user';
import userService from '~/services/user';

const UserEditScreen = memo((props: IUseNavigation) => {
  const navigation = useNavigation(props);
  const validationRef = useRef<IValidationContextRef>();

  const [model, setModelProp] = useModel<IUser>(navigation.getParam('user'));

  const [onSave] = useCallbackObservable(() => {
    return of(true).pipe(
      tap(() => Keyboard.dismiss()),
      switchMap(() => timer(500)),
      first(),
      switchMap(() => validationRef.current.isValid()),
      tap(valid => !valid && Toast.showError('Revise os campos')),
      filter(valid => valid),
      switchMap(() => userService.save(model as IUser).pipe(loader())),
      logError(),
      tap(() => navigation.back(), err => Toast.showError(err))
    );
  }, [model, navigation]);

  useEffect(() => {
    navigation.setParam({ onSave });
  }, [navigation, onSave]);

  return (
    <Container>
      <Content padder keyboardShouldPersistTaps='handled'>
        <Form>
          <ValidationContext ref={validationRef}>
            <List>
              <FieldText
                label='Nome'
                validation='string|required|min:3|max:50'
                value={model.firstName}
                flowIndex={1}
                onChange={setModelProp('firstName', (value, model) => (model.firstName = value))}
              />

              <FieldText
                label='Sobrenome'
                validation='string|max:50'
                value={model.lastName}
                flowIndex={2}
                onChange={setModelProp('lastName', (value, model) => (model.lastName = value))}
              />

              <FieldText
                label='Email'
                validation='string|email|max:150'
                keyboardType='email-address'
                value={model.email}
                flowIndex={3}
                onChange={setModelProp('email', (value, model) => (model.email = value))}
              />
            </List>
          </ValidationContext>
        </Form>
      </Content>
    </Container>
  );
});

UserEditScreen.navigationOptions = ({ navigation }) => {
  return {
    title: 'Atualizar Perfil',
    headerRight: (
      <Button style={classes.headerButton} onPress={navigation.getParam('onSave')}>
        <Icon name='save' />
      </Button>
    )
  };
};

export default UserEditScreen;
