import * as customerRepository from './customer.repository';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from './customer.model';

export class CustomerNotFoundError extends Error {
  constructor() {
    super('Customer not found.');
    this.name = 'CustomerNotFoundError';
  }
}

export class DuplicateCustomerEmailError extends Error {
  constructor() {
    super('A customer with this email already exists.');
    this.name = 'DuplicateCustomerEmailError';
  }
}

function isDuplicateEmailError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    error.constraint === 'customers_email_key'
  );
}

async function handleRepositoryError<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw new DuplicateCustomerEmailError();
    }

    throw error;
  }
}

export async function createCustomer(input: CreateCustomerInput) {
  return handleRepositoryError(() =>
    customerRepository.createCustomer(input),
  );
}

export async function listCustomers() {
  return customerRepository.listCustomers();
}

export async function getCustomerById(id: string) {
  const customer = await customerRepository.getCustomerById(id);

  if (!customer) {
    throw new CustomerNotFoundError();
  }

  return customer;
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
) {
  return handleRepositoryError(async () => {
    const customer = await customerRepository.updateCustomer(id, input);

    if (!customer) {
      throw new CustomerNotFoundError();
    }

    return customer;
  });
}

export async function deleteCustomer(id: string) {
  const deleted = await customerRepository.deleteCustomer(id);

  if (!deleted) {
    throw new CustomerNotFoundError();
  }
}
