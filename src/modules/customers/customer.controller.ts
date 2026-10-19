import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import * as customerService from './customer.service';
import { createCustomerSchema, updateCustomerSchema } from './customer.validation';

function isValidCustomerId(id: string): boolean {
  return /^[1-9]\d*$/.test(id);
}

function handleError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.issues.map((issue) => issue.message),
    });
    return;
  }

  if (error instanceof customerService.CustomerNotFoundError) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message,
    });
    return;
  }

  if (error instanceof customerService.DuplicateCustomerEmailError) {
    res.status(409).json({
      error: 'Conflict',
      message: error.message,
    });
    return;
  }

  next(error);
}

export async function createCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(input);

    res.status(201).json({ data: customer });
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function listCustomers(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customers = await customerService.listCustomers();

    res.status(200).json({ data: customers });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidCustomerId(id)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Customer ID must be a positive integer.',
      });
      return;
    }

    const customer = await customerService.getCustomerById(id);

    res.status(200).json({ data: customer });
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidCustomerId(id)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Customer ID must be a positive integer.',
      });
      return;
    }

    const input = updateCustomerSchema.parse(req.body);
    const customer = await customerService.updateCustomer(id, input);

    res.status(200).json({ data: customer });
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteCustomer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidCustomerId(id)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Customer ID must be a positive integer.',
      });
      return;
    }

    await customerService.deleteCustomer(id);

    res.status(204).send();
  } catch (error) {
    handleError(error, res, next);
  }
}
