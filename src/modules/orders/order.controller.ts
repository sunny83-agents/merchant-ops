import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  createOrderService,
  CustomerNotFoundError,
  deleteOrderService,
  getOrderService,
  listOrdersService,
  OrderNotFoundError,
  updateOrderService,
} from './order.service';
import { createOrderSchema, updateOrderSchema } from './order.validation';

const parseId = (value: string | string[]): number | null => {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
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

  if (error instanceof CustomerNotFoundError) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof OrderNotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }

  next(error);
};

export const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = createOrderSchema.parse(req.body);
    const order = await createOrderService(input);
    res.status(201).json(order);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const listOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      res.status(400).json({
        error: 'Page must be at least 1 and limit must be between 1 and 100',
      });
      return;
    }

    const result = await listOrdersService(page, limit);

    res.status(200).json({
      data: result.orders,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    res.status(200).json(await getOrderService(id));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const input = updateOrderSchema.parse(req.body);
    res.status(200).json(await updateOrderService(id, input));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);

    if (id === null) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    await deleteOrderService(id);
    res.status(204).send();
  } catch (error) {
    handleError(error, res, next);
  }
};