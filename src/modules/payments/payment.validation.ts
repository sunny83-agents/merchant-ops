import { z } from 'zod';

const currencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Currency must be a three-letter uppercase code');

export const createPaymentSchema = z
  .object({
    order_id: z
      .string()
      .regex(/^[1-9]\d*$/, 'Order ID must be a positive integer'),
    amount: z.number().finite().positive().max(9999999999.99),
    currency: currencySchema.optional(),
    provider_reference: z.string().trim().min(1).max(255).nullable().optional(),
  })
  .strict();

export const updatePaymentSchema = z
  .object({
    status: z.enum(['pending', 'succeeded', 'failed']).optional(),
    provider_reference: z.string().trim().min(1).max(255).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });
