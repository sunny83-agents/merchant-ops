
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as paymentRepository from '../src/modules/payments/payment.repository';
import { getOrderById } from '../src/modules/orders/order.repository';
import * as paymentService from '../src/modules/payments/payment.service';
import type { Payment } from '../src/modules/payments/payment.model';
import type { Order } from '../src/modules/orders/order.model';

jest.mock('../src/modules/payments/payment.repository');
jest.mock('../src/modules/orders/order.repository');

const mockedPaymentRepository = jest.mocked(paymentRepository);
const mockedGetOrderById = jest.mocked(getOrderById);

const sampleOrder: Order = {
  id: 1,
  customer_id: '1',
  status: 'confirmed',
  total_amount: '100.00',
  currency: 'INR',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

const samplePayment: Payment = {
  id: 1,
  order_id: '1',
  amount: '50.00',
  currency: 'INR',
  status: 'pending',
  provider_reference: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

describe('Payment service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('creates a payment for an existing order', async () => {
      mockedGetOrderById.mockResolvedValue(sampleOrder);
      mockedPaymentRepository.createPayment.mockResolvedValue(samplePayment);

      const result = await paymentService.createPayment({
        order_id: '1',
        amount: 50,
      });

      expect(result).toEqual(samplePayment);
      expect(mockedPaymentRepository.createPayment).toHaveBeenCalledWith({
        order_id: '1',
        amount: 50,
        currency: 'INR',
      });
    });

    it('rejects a missing order', async () => {
      mockedGetOrderById.mockResolvedValue(null);

      await expect(
        paymentService.createPayment({ order_id: '1', amount: 50 }),
      ).rejects.toMatchObject({
        message: 'Order not found',
        statusCode: 404,
      });
    });

    it('rejects a cancelled order', async () => {
      mockedGetOrderById.mockResolvedValue({
        ...sampleOrder,
        status: 'cancelled',
      });

      await expect(
        paymentService.createPayment({ order_id: '1', amount: 50 }),
      ).rejects.toMatchObject({
        message: 'Cannot create a payment for a cancelled order',
        statusCode: 400,
      });
    });

    it('rejects an amount greater than the order total', async () => {
      mockedGetOrderById.mockResolvedValue(sampleOrder);

      await expect(
        paymentService.createPayment({ order_id: '1', amount: 101 }),
      ).rejects.toMatchObject({
        message: 'Payment amount cannot exceed the order total',
        statusCode: 400,
      });
    });

    it('rejects a zero payment amount', async () => {
      mockedGetOrderById.mockResolvedValue(sampleOrder);

      await expect(
        paymentService.createPayment({ order_id: '1', amount: 0 }),
      ).rejects.toMatchObject({
        message: 'Payment amount must be positive',
        statusCode: 400,
      });
    });

    it('rejects a currency that differs from the order currency', async () => {
      mockedGetOrderById.mockResolvedValue(sampleOrder);

      await expect(
        paymentService.createPayment({
          order_id: '1',
          amount: 50,
          currency: 'USD',
        }),
      ).rejects.toMatchObject({
        message: 'Payment currency must match the order currency',
        statusCode: 400,
      });
    });

    it('rejects a malformed currency code', async () => {
      mockedGetOrderById.mockResolvedValue(sampleOrder);

      await expect(
        paymentService.createPayment({
          order_id: '1',
          amount: 50,
          currency: 'inr',
        }),
      ).rejects.toMatchObject({
        message: 'Currency must be a three-letter uppercase code',
        statusCode: 400,
      });
    });

    it('rejects an invalid order ID', async () => {
      await expect(
        paymentService.createPayment({ order_id: 'abc', amount: 50 }),
      ).rejects.toMatchObject({
        message: 'Invalid order ID',
        statusCode: 400,
      });

      expect(mockedGetOrderById).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentById', () => {
    it('returns the payment when found', async () => {
      mockedPaymentRepository.getPaymentById.mockResolvedValue(samplePayment);

      await expect(paymentService.getPaymentById(1)).resolves.toEqual(
        samplePayment,
      );
    });

    it('rejects when the payment does not exist', async () => {
      mockedPaymentRepository.getPaymentById.mockResolvedValue(null);

      await expect(paymentService.getPaymentById(999)).rejects.toMatchObject({
        message: 'Payment not found',
        statusCode: 404,
      });
    });
  });

  describe('updatePayment', () => {
    it('updates a pending payment', async () => {
      mockedPaymentRepository.getPaymentById.mockResolvedValue(samplePayment);
      mockedPaymentRepository.updatePayment.mockResolvedValue({
        ...samplePayment,
        status: 'succeeded',
        provider_reference: 'txn-123',
      });

      const result = await paymentService.updatePayment(1, {
        status: 'succeeded',
        provider_reference: 'txn-123',
      });

      expect(result.status).toBe('succeeded');
      expect(mockedPaymentRepository.updatePayment).toHaveBeenCalledWith(1, {
        status: 'succeeded',
        provider_reference: 'txn-123',
      });
    });

    it('rejects changing the status of a succeeded payment', async () => {
      mockedPaymentRepository.getPaymentById.mockResolvedValue({
        ...samplePayment,
        status: 'succeeded',
      });

      await expect(
        paymentService.updatePayment(1, { status: 'failed' }),
      ).rejects.toMatchObject({
        message: 'Only pending payments can change status',
        statusCode: 400,
      });

      expect(mockedPaymentRepository.updatePayment).not.toHaveBeenCalled();
    });

    it('rejects an empty provider reference', async () => {
      mockedPaymentRepository.getPaymentById.mockResolvedValue(samplePayment);

      await expect(
        paymentService.updatePayment(1, { provider_reference: '   ' }),
      ).rejects.toMatchObject({
        message: 'Provider reference cannot be empty',
        statusCode: 400,
      });
    });

    it('rejects updating a missing payment', async () => {
      mockedPaymentRepository.getPaymentById.mockResolvedValue(null);

      await expect(
        paymentService.updatePayment(999, { status: 'failed' }),
      ).rejects.toMatchObject({
        message: 'Payment not found',
        statusCode: 404,
      });
    });
  });
});

