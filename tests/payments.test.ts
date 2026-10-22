import request from 'supertest';
import { jest } from '@jest/globals';

jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    on: jest.fn(),
  },
}));

jest.mock('../src/modules/payments/payment.service', () => ({
  PaymentServiceError: class PaymentServiceError extends Error {
    constructor(
      message: string,
      public readonly statusCode: number,
    ) {
      super(message);
    }
  },
  createPayment: jest.fn(),
  listPayments: jest.fn(),
  getPaymentById: jest.fn(),
  updatePayment: jest.fn(),
}));

import app from '../src/app';
import * as paymentService from '../src/modules/payments/payment.service';

const mockPayment = {
  id: 1,
  order_id: '1',
  amount: '125.50',
  currency: 'INR',
  status: 'pending',
  provider_reference: null,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
};

describe('Payments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a payment', async () => {
    jest.mocked(paymentService.createPayment).mockResolvedValue(mockPayment);

    const response = await request(app).post('/payments').send({
      order_id: '1',
      amount: 125.5,
      currency: 'INR',
    });

    expect(response.status).toBe(201);
    expect(response.body.payment.id).toBe(1);
    expect(response.body.payment.order_id).toBe('1');
  });

  it('lists payments with pagination metadata', async () => {
    jest.mocked(paymentService.listPayments).mockResolvedValue({
      payments: [mockPayment],
      total: 21,
    });

    const response = await request(app).get('/payments?page=2&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.payments).toHaveLength(1);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
    expect(paymentService.listPayments).toHaveBeenCalledWith(
      2,
      10,
      undefined,
      undefined,
    );
  });

  it('filters payments by order ID and status', async () => {
    jest.mocked(paymentService.listPayments).mockResolvedValue({
      payments: [mockPayment],
      total: 1,
    });

    const response = await request(app).get(
      '/payments?order_id=1&status=pending',
    );

    expect(response.status).toBe(200);
    expect(paymentService.listPayments).toHaveBeenCalledWith(
      1,
      10,
      '1',
      'pending',
    );
  });

  it('rejects an invalid payment status filter', async () => {
    const response = await request(app).get('/payments?status=unknown');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid payment status');
    expect(paymentService.listPayments).not.toHaveBeenCalled();
  });

  it('rejects invalid pagination parameters', async () => {
    const response = await request(app).get('/payments?page=0&limit=200');

    expect(response.status).toBe(400);
  });

  it('rejects an invalid order ID filter', async () => {
    const response = await request(app).get('/payments?order_id=abc');

    expect(response.status).toBe(400);
    expect(paymentService.listPayments).not.toHaveBeenCalled();
  });

  it('gets a payment by ID', async () => {
    jest.mocked(paymentService.getPaymentById).mockResolvedValue(mockPayment);

    const response = await request(app).get('/payments/1');

    expect(response.status).toBe(200);
    expect(response.body.payment.id).toBe(1);
  });

  it('updates a payment', async () => {
    jest.mocked(paymentService.updatePayment).mockResolvedValue({
      ...mockPayment,
      status: 'succeeded',
    });

    const response = await request(app)
      .patch('/payments/1')
      .send({ status: 'succeeded' });

    expect(response.status).toBe(200);
    expect(response.body.payment.status).toBe('succeeded');
  });

  it('returns 404 for a missing payment', async () => {
    jest
      .mocked(paymentService.getPaymentById)
      .mockRejectedValue(new paymentService.PaymentServiceError('Payment not found', 404));

    const response = await request(app).get('/payments/999');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Payment not found');
  });

    it('returns 400 for a payment service validation error', async () => {
    jest
      .mocked(paymentService.createPayment)
      .mockRejectedValue(
        new paymentService.PaymentServiceError('Order not found', 400),
      );

    const response = await request(app).post('/payments').send({
      order_id: '1',
      amount: 100,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Order not found');
  });
  it('rejects invalid payment creation data', async () => {
    const response = await request(app).post('/payments').send({
      order_id: 'abc',
      amount: -10,
      unexpected: true,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(paymentService.createPayment).not.toHaveBeenCalled();
  });

  it('rejects an empty payment update', async () => {
    const response = await request(app).patch('/payments/1').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(paymentService.updatePayment).not.toHaveBeenCalled();
  });

  it('rejects an invalid payment update status', async () => {
    const response = await request(app)
      .patch('/payments/1')
      .send({ status: 'refunded' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(paymentService.updatePayment).not.toHaveBeenCalled();
  });
});
