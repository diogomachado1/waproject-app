import { Observable } from 'rxjs';
import { IOrder } from '~/interfaces/models/order';

import apiService, { ApiService } from './api';

export class OrderService {
  constructor(private apiService: ApiService) {}

  public insert(order: IOrder): Observable<void> {
    return this.apiService.post('/order', { ...order });
  }
}

const orderService = new OrderService(apiService);
export default orderService;
