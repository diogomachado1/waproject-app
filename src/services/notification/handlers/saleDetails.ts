import { InteractionManager } from '~/facades/interactionManager';
import { INotificationHandler } from '~/interfaces/notification';

export const handle: INotificationHandler = async (notification, dispatch, appStarted) => {
  const reg =
    /^\[novo\sboleto\sgerado\].+\#([0-9]+)$/gi.exec(notification.body) ||
    /^\[venda\sconfirmada\].+\#([0-9]+)$/gi.exec(notification.body) ||
    /^\[nova\scomiss[aã]o\].+\#([0-9]+)$/gi.exec(notification.body);

  if (!reg) {
    return false;
  }

  if (appStarted) {
    dispatch({
      type: 'Navigation/NAVIGATE',
      routeName: 'Home'
    });

    await InteractionManager.runAfterInteractions();
  }

  const invoiceId = Number(reg[1]);

  dispatch({
    key: `sales-details-${invoiceId}`,
    type: 'Navigation/NAVIGATE',
    routeName: 'SalesDetails',
    params: { invoiceId }
  });

  return true;
};
