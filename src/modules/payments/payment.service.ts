import type {
  CreatePaymentInput,
  Payment,
  UpdatePaymentInput,
} from './payment.model';
import * as paymentRepository from './payment.repository';
import { getOrderById } from '../orders/order.repository';

export class PaymentServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'PaymentServiceError';
  }
}

export const createPayment = async (
  input: CreatePaymentInput,
): Promise<Payment> => {
  const orderId = Number(input.order_id);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new PaymentServiceError('Invalid order ID', 400);
  }

  const order = await getOrderById(orderId);

  if (!order) {
    throw new PaymentServiceError('Order not found', 404);
  }

  if (order.status === 'cancelled') {
    throw new PaymentServiceError(
      'Cannot create a payment for a cancelled order',
      400,
    );
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new PaymentServiceError('Payment amount must be positive', 400);
  }

  if (input.amount > Number(order.total_amount)) {
    throw new PaymentServiceError(
      'Payment amount cannot exceed the order total',
      400,
    );
  }

  const currency = input.currency ?? order.currency;

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new PaymentServiceError(
      'Currency must be a three-letter uppercase code',
      400,
    );
  }

  if (currency !== order.currency) {
    throw new PaymentServiceError(
      'Payment currency must match the order currency',
      400,
    );
  }

  return paymentRepository.createPayment({
    ...input,
    currency,
  });
};

export const listPayments = (
  page: number,
  limit: number,
  orderId?: string,
  status?: Payment['status'],
): Promise<{ payments: Payment[]; total: number }> => {
  return paymentRepository.listPayments(page, limit, orderId, status);
};

export const getPaymentById = async (id: number): Promise<Payment> => {
  const payment = await paymentRepository.getPaymentById(id);

  if (!payment) {
    throw new PaymentServiceError('Payment not found', 404);
  }

  return payment;
};

export const updatePayment = async (
  id: number,
  input: UpdatePaymentInput,
): Promise<Payment> => {
  const existingPayment = await paymentRepository.getPaymentById(id);

  if (!existingPayment) {
    throw new PaymentServiceError('Payment not found', 404);
  }

  if (
    existingPayment.status !== 'pending' &&
    input.status !== undefined &&
    input.status !== existingPayment.status
  ) {
    throw new PaymentServiceError(
      'Only pending payments can change status',
      400,
    );
  }

  if (
    input.provider_reference !== undefined &&
    input.provider_reference !== null &&
    input.provider_reference.trim() === ''
  ) {
    throw new PaymentServiceError(
      'Provider reference cannot be empty',
      400,
    );
  }

  const updatedPayment = await paymentRepository.updatePayment(id, input);

  if (!updatedPayment) {
    throw new PaymentServiceError('Payment not found', 404);
  }

  return updatedPayment;
};
