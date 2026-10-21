import { pool } from '../../config/database';
import type { CreateOrderInput, Order, UpdateOrderInput } from './order.model';

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  const result = await pool.query<Order>(
    `INSERT INTO orders (customer_id, total_amount, currency)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.customer_id, input.total_amount, input.currency ?? 'INR'],
  );

  return result.rows[0];
};

export const listOrders = async (
  page: number,
  limit: number,
  status?: Order['status'],
): Promise<{ orders: Order[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [ordersResult, countResult] = await Promise.all([
    pool.query<Order>(
      `SELECT * FROM orders
       WHERE ($1::text IS NULL OR status = $1)
       ORDER BY created_at DESC, id DESC
       LIMIT $2 OFFSET $3`,
      [status ?? null, limit, offset],
    ),
    pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM orders
       WHERE ($1::text IS NULL OR status = $1)`,
      [status ?? null],
    ),
  ]);

  return {
    orders: ordersResult.rows,
    total: Number(countResult.rows[0].total),
  };
};

export const getOrderById = async (id: number): Promise<Order | null> => {
  const result = await pool.query<Order>('SELECT * FROM orders WHERE id = $1', [id]);

  return result.rows[0] ?? null;
};

export const updateOrder = async (id: number, input: UpdateOrderInput): Promise<Order | null> => {
  const result = await pool.query<Order>(
    `UPDATE orders
     SET status = COALESCE($2, status),
         total_amount = COALESCE($3, total_amount),
         currency = COALESCE($4, currency),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, input.status ?? null, input.total_amount ?? null, input.currency ?? null],
  );

  return result.rows[0] ?? null;
};

export const deleteOrder = async (id: number): Promise<boolean> => {
  const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);

  return (result.rowCount ?? 0) > 0;
};
