import { z } from 'zod';

const currencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Currency must be a three-letter uppercase code');

export const createOrderSchema = z
  .object({
    customer_id: z
      .string()
      .regex(/^[1-9]\d*$/, 'Customer ID must be a positive integer'),
    total_amount: z
      .number()
      .finite()
      .min(0)
      .max(9999999999.99),
    currency: currencySchema.optional(),
  })
  .strict();

export const updateOrderSchema = z
  .object({
    status: z
      .enum([
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ])
      .optional(),
    total_amount: z
      .number()
      .finite()
      .min(0)
      .max(9999999999.99)
      .optional(),
    currency: currencySchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });