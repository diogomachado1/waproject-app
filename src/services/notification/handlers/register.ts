import { NotificationService } from '..';
import { handle as saleDetails } from './saleDetails';

export function register(notificationService: NotificationService) {
  notificationService.registerHandler(saleDetails);
}
