import { pool } from '../../config/database';
import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from './customer.model';

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<Customer> {
  const result = await pool.query<Customer>(
    `INSERT INTO customers (name, email, phone)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, phone, created_at, updated_at`,
    [input.name, input.email, input.phone ?? null],
  );

  return result.rows[0];
}

export async function listCustomers(): Promise<Customer[]> {
  const result = await pool.query<Customer>(
    `SELECT id, name, email, phone, created_at, updated_at
     FROM customers
     ORDER BY id DESC`,
  );

  return result.rows;
}

export async function getCustomerById(
  id: string,
): Promise<Customer | null> {
  const result = await pool.query<Customer>(
    `SELECT id, name, email, phone, created_at, updated_at
     FROM customers
     WHERE id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<Customer | null> {
  const result = await pool.query<Customer>(
    `UPDATE customers
     SET
       name = COALESCE($2, name),
       email = COALESCE($3, email),
       phone = CASE WHEN $4::boolean THEN $5::varchar ELSE phone END,
       updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, phone, created_at, updated_at`,
    [
      id,
      input.name ?? null,
      input.email ?? null,
      Object.hasOwn(input, 'phone'),
      input.phone ?? null,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM customers WHERE id = $1',
    [id],
  );

  return (result.rowCount ?? 0) > 0;
}
