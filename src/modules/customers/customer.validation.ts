import { z } from 'zod';

export const createCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(30).nullable().optional(),
  })
  .strict();

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    email: z.string().trim().email().max(255).optional(),
    phone: z.string().trim().max(30).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });
