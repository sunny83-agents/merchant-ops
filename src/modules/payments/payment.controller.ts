import type { Request, Response, NextFunction } from 'express';
import * as paymentService from './payment.service';
import type { PaymentStatus } from './payment.model';
import { ZodError } from 'zod';
import {
  createPaymentSchema,
  updatePaymentSchema,
} from './payment.validation';

const parsePositiveInteger = (value: string): number | null => {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};
const handleError = (
  error: unknown,
  res: Response,
  next: NextFunction,
): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: error.issues,
    });
    return;
  }

  next(error);
};

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payment = await paymentService.createPayment(
      createPaymentSchema.parse(req.body),
    );

    res.status(201).json({ payment });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const listPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parsePositiveInteger(String(req.query.page ?? '1'));
    const limit = parsePositiveInteger(String(req.query.limit ?? '10'));

    if (page === null || limit === null || limit > 100) {
      res.status(400).json({
        error: 'Page must be positive and limit must be between 1 and 100',
      });
      return;
    }

    const orderId =
      req.query.order_id === undefined
        ? undefined
        : String(req.query.order_id);

    if (
      orderId !== undefined &&
      (!/^[1-9]\d*$/.test(orderId) ||
        !Number.isSafeInteger(Number(orderId)))
    ) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const rawStatus = req.query.status;
    const allowedStatuses: PaymentStatus[] = [
      'pending',
      'succeeded',
      'failed',
    ];

    if (
      rawStatus !== undefined &&
      (typeof rawStatus !== 'string' ||
        !allowedStatuses.includes(rawStatus as PaymentStatus))
    ) {
      res.status(400).json({
        error: 'Invalid payment status',
        validStatuses: allowedStatuses,
      });
      return;
    }

    const result = await paymentService.listPayments(
      page,
      limit,
      orderId,
      rawStatus as PaymentStatus | undefined,
    );

    res.status(200).json({
      payments: result.payments,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idParam = req.params.id;
    const id = typeof idParam === 'string' ? parsePositiveInteger(idParam) : null;

    if (id === null) {
      res.status(400).json({ error: 'Invalid payment ID' });
      return;
    }

    const payment = await paymentService.getPaymentById(id);
    res.status(200).json({ payment });
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idParam = req.params.id;
    const id = typeof idParam === 'string' ? parsePositiveInteger(idParam) : null;

    if (id === null) {
      res.status(400).json({ error: 'Invalid payment ID' });
      return;
    }

    const payment = await paymentService.updatePayment(
      id,
      updatePaymentSchema.parse(req.body),
    );

    res.status(200).json({ payment });
  } catch (error) {
    handleError(error, res, next);
  }
};
