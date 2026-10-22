import { pool } from '../../config/database';
import type {
  CreatePaymentInput,
  Payment,
  UpdatePaymentInput,
} from './payment.model';

export const createPayment = async (
  input: CreatePaymentInput,
): Promise<Payment> => {
  const result = await pool.query<Payment>(
    `INSERT INTO payments (order_id, amount, currency, provider_reference)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      input.order_id,
      input.amount,
      input.currency ?? 'INR',
      input.provider_reference ?? null,
    ],
  );

  return result.rows[0];
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
  const result = await pool.query<Payment>(
    'SELECT * FROM payments WHERE id = $1',
    [id],
  );

  return result.rows[0] ?? null;
};

export const updatePayment = async (
  id: number,
  input: UpdatePaymentInput,
): Promise<Payment | null> => {
  const result = await pool.query<Payment>(
    `UPDATE payments
     SET status = COALESCE($2, status),
         provider_reference = COALESCE($3, provider_reference),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, input.status ?? null, input.provider_reference ?? null],
  );

  return result.rows[0] ?? null;
};
