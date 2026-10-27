import { pool } from '../../config/database';
import type { CreatePaymentInput, Payment, UpdatePaymentInput } from './payment.model';

export class PaymentRepositoryError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'PaymentRepositoryError';
  }
}

export const createPayment = async (input: CreatePaymentInput): Promise<Payment> => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const orderResult = await client.query<{
      id: number;
      total_amount: string;
      currency: string;
    }>('SELECT id, total_amount, currency FROM orders WHERE id = $1 FOR UPDATE', [input.order_id]);

    const order = orderResult.rows[0];

    if (!order) {
      throw new PaymentRepositoryError('Order not found', 404);
    }

    if (input.currency && input.currency !== order.currency) {
      throw new PaymentRepositoryError(
        'Payment currency must match the order currency',
        400,
      );
    }

    const balanceResult = await client.query<{ reserved_amount: string }>(
      `SELECT COALESCE(SUM(amount), 0)::text AS reserved_amount
       FROM payments
       WHERE order_id = $1
         AND status IN ('pending', 'succeeded')`,
      [input.order_id],
    );

    const amountCents = Math.round(input.amount * 100);
    const totalCents = Math.round(Number(order.total_amount) * 100);
    const reservedCents = Math.round(Number(balanceResult.rows[0].reserved_amount) * 100);

    if (amountCents + reservedCents > totalCents) {
      throw new PaymentRepositoryError('Payment amount exceeds the remaining order balance', 400);
    }

    const result = await client.query<Payment>(
      `INSERT INTO payments (order_id, amount, currency, provider_reference)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        input.order_id,
        input.amount,
        input.currency ?? order.currency,
        input.provider_reference ?? null,
      ],
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Preserve the original error if rollback also fails.
      }
    }

    throw error;
  } finally {
    client.release();
  }
};

export const listPayments = async (
  page: number,
  limit: number,
  orderId?: string,
  status?: Payment['status'],
): Promise<{ payments: Payment[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [paymentsResult, countResult] = await Promise.all([
    pool.query<Payment>(
      `SELECT * FROM payments
       WHERE ($1::bigint IS NULL OR order_id = $1)
         AND ($2::text IS NULL OR status = $2)
       ORDER BY created_at DESC, id DESC
       LIMIT $3 OFFSET $4`,
      [orderId ?? null, status ?? null, limit, offset],
    ),
    pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM payments
       WHERE ($1::bigint IS NULL OR order_id = $1)
         AND ($2::text IS NULL OR status = $2)`,
      [orderId ?? null, status ?? null],
    ),
  ]);

  return {
    payments: paymentsResult.rows,
    total: Number(countResult.rows[0].total),
  };
};

export const getPaymentById = async (id: number): Promise<Payment | null> => {
  const result = await pool.query<Payment>('SELECT * FROM payments WHERE id = $1', [id]);

  return result.rows[0] ?? null;
};

export const updatePayment = async (
  id: number,
  input: UpdatePaymentInput,
): Promise<Payment | null> => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const initialResult = await client.query<Payment>('SELECT * FROM payments WHERE id = $1', [id]);

    const initialPayment = initialResult.rows[0];

    if (!initialPayment) {
      await client.query('ROLLBACK');
      return null;
    }

    const orderResult = await client.query<{ id: number }>(
      'SELECT id FROM orders WHERE id = $1 FOR UPDATE',
      [initialPayment.order_id],
    );

    if (!orderResult.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    const paymentResult = await client.query<Payment>(
      'SELECT * FROM payments WHERE id = $1 FOR UPDATE',
      [id],
    );

    const payment = paymentResult.rows[0];

    if (!payment) {
      await client.query('ROLLBACK');
      return null;
    }

    if (input.status === 'succeeded' && payment.status !== 'succeeded') {
      const balanceResult = await client.query<{ reserved_amount: string }>(
        `SELECT COALESCE(SUM(amount), 0)::text AS reserved_amount
         FROM payments
         WHERE order_id = $1
           AND status IN ('pending', 'succeeded')
           AND id <> $2`,
        [payment.order_id, id],
      );

      const reservedCents = Math.round(Number(balanceResult.rows[0].reserved_amount) * 100);
      const paymentCents = Math.round(Number(payment.amount) * 100);

      const orderResult = await client.query<{ total_amount: string }>(
        'SELECT total_amount FROM orders WHERE id = $1',
        [payment.order_id],
      );

      const totalCents = Math.round(Number(orderResult.rows[0]?.total_amount ?? 0) * 100);

      if (reservedCents + paymentCents > totalCents) {
        throw new PaymentRepositoryError('Payment exceeds the remaining order balance', 400);
      }
    }

    const result = await client.query<Payment>(
      `UPDATE payments
       SET status = COALESCE($2, status),
           provider_reference = COALESCE($3, provider_reference),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, input.status ?? null, input.provider_reference ?? null],
    );

    await client.query('COMMIT');
    return result.rows[0] ?? null;
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Preserve the original error if rollback also fails.
      }
    }

    throw error;
  } finally {
    client.release();
  }
};
