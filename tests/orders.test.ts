import request from 'supertest';
import { jest } from '@jest/globals';

jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    on: jest.fn(),
  },
}));

jest.mock('../src/modules/orders/order.service', () => {
  class OrderNotFoundError extends Error {}
  class CustomerNotFoundError extends Error {}

  return {
    OrderNotFoundError,
    CustomerNotFoundError,
    createOrderService: jest.fn(),
    listOrdersService: jest.fn(),
    getOrderService: jest.fn(),
    updateOrderService: jest.fn(),
    deleteOrderService: jest.fn(),
  };
});

import app from '../src/app';
import * as orderService from '../src/modules/orders/order.service';

const mockOrder = {
  id: 1,
  customer_id: '1',
  status: 'pending',
  total_amount: '125.50',
  currency: 'INR',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
};

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an order', async () => {
    jest.mocked(orderService.createOrderService).mockResolvedValue(mockOrder);

    const response = await request(app).post('/orders').send({
      customer_id: '1',
      total_amount: 125.5,
      currency: 'INR',
    });

    expect(response.status).toBe(201);
    expect(response.body.customer_id).toBe('1');
    expect(response.body.total_amount).toBe('125.50');
  });

      it('lists orders with pagination metadata', async () => {
    jest.mocked(orderService.listOrdersService).mockResolvedValue({
      orders: [mockOrder],
      total: 21,
    });

    const response = await request(app).get('/orders?page=2&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
    expect(orderService.listOrdersService).toHaveBeenCalledWith(2, 10);
  });

  it('rejects invalid pagination parameters', async () => {
    const response = await request(app).get('/orders?page=0&limit=200');

    expect(response.status).toBe(400);
  });

  it('gets an order by ID', async () => {
    jest.mocked(orderService.getOrderService).mockResolvedValue(mockOrder);

    const response = await request(app).get('/orders/1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  it('updates an order', async () => {
    jest.mocked(orderService.updateOrderService).mockResolvedValue({
      ...mockOrder,
      status: 'shipped',
    });

    const response = await request(app)
      .patch('/orders/1')
      .send({ status: 'shipped' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('shipped');
  });

  it('deletes an order', async () => {
    jest.mocked(orderService.deleteOrderService).mockResolvedValue(undefined);

    const response = await request(app).delete('/orders/1');

    expect(response.status).toBe(204);
  });

  it('rejects invalid order data', async () => {
    const response = await request(app).post('/orders').send({
      customer_id: 'abc',
      total_amount: -10,
    });

    expect(response.status).toBe(400);
  });

  it('rejects an empty update', async () => {
    const response = await request(app).patch('/orders/1').send({});

    expect(response.status).toBe(400);
  });

  it('rejects an invalid order ID', async () => {
    const response = await request(app).get('/orders/abc');

    expect(response.status).toBe(400);
  });

  it('returns 404 when an order does not exist', async () => {
    jest
      .mocked(orderService.getOrderService)
      .mockRejectedValue(new orderService.OrderNotFoundError());

    const response = await request(app).get('/orders/999');

    expect(response.status).toBe(404);
  });

  it('returns 400 when the customer does not exist', async () => {
    jest
      .mocked(orderService.createOrderService)
      .mockRejectedValue(new orderService.CustomerNotFoundError());

    const response = await request(app).post('/orders').send({
      customer_id: '999',
      total_amount: 100,
    });

    expect(response.status).toBe(400);
  });
});