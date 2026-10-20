import {
  createOrder,
  deleteOrder,
  getOrderById,
  listOrders,
  updateOrder,
} from './order.repository';
import type {
  CreateOrderInput,
  Order,
  UpdateOrderInput,
} from './order.model';

export class OrderNotFoundError extends Error {
  constructor() {
    super('Order not found');
    this.name = 'OrderNotFoundError';
  }
}

export class CustomerNotFoundError extends Error {
  constructor() {
    super('Customer not found');
    this.name = 'CustomerNotFoundError';
  }
}

export const createOrderService = async (
  input: CreateOrderInput,
): Promise<Order> => {
  try {
    return await createOrder(input);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23503'
    ) {
      throw new CustomerNotFoundError();
    }

    throw error;
  }
};

export const listOrdersService = (): Promise<Order[]> => listOrders();

export const getOrderService = async (id: number): Promise<Order> => {
  const order = await getOrderById(id);

  if (!order) {
    throw new OrderNotFoundError();
  }

  return order;
};

export const updateOrderService = async (
  id: number,
  input: UpdateOrderInput,
): Promise<Order> => {
  const order = await updateOrder(id, input);

  if (!order) {
    throw new OrderNotFoundError();
  }

  return order;
};

export const deleteOrderService = async (id: number): Promise<void> => {
  const deleted = await deleteOrder(id);

  if (!deleted) {
    throw new OrderNotFoundError();
  }
};