import request from 'supertest';
import { jest } from '@jest/globals';

jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    on: jest.fn(),
  },
}));

jest.mock('../src/modules/customers/customer.service', () => {
  class CustomerNotFoundError extends Error {}
  class DuplicateCustomerEmailError extends Error {}

  return {
    CustomerNotFoundError,
    DuplicateCustomerEmailError,
    createCustomer: jest.fn(),
    listCustomers: jest.fn(),
    getCustomerById: jest.fn(),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn(),
  };
});

import app from '../src/app';
import * as customerService from '../src/modules/customers/customer.service';

const mockCustomer = {
  id: '1',
  name: 'Sunny Sharma',
  email: 'sunny@example.com',
  phone: '9876543210',
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
};

describe('Customer API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a customer', async () => {
    jest.mocked(customerService.createCustomer).mockResolvedValue(mockCustomer);

    const response = await request(app)
      .post('/customers')
      .send({
        name: 'Sunny Sharma',
        email: 'sunny@example.com',
        phone: '9876543210',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe('sunny@example.com');
  });

  it('lists customers', async () => {
    jest.mocked(customerService.listCustomers).mockResolvedValue([mockCustomer]);

    const response = await request(app).get('/customers');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('gets a customer by ID', async () => {
    jest.mocked(customerService.getCustomerById).mockResolvedValue(mockCustomer);

    const response = await request(app).get('/customers/1');

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('1');
  });

  it('updates a customer', async () => {
    jest.mocked(customerService.updateCustomer).mockResolvedValue({
      ...mockCustomer,
      name: 'Sunny Updated',
    });

    const response = await request(app)
      .patch('/customers/1')
      .send({ name: 'Sunny Updated' });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('Sunny Updated');
  });

  it('deletes a customer', async () => {
    jest.mocked(customerService.deleteCustomer).mockResolvedValue(undefined);

    const response = await request(app).delete('/customers/1');

    expect(response.status).toBe(204);
  });

  it('rejects invalid customer data', async () => {
    const response = await request(app)
      .post('/customers')
      .send({ name: '', email: 'invalid-email' });

    expect(response.status).toBe(400);
  });

  it('rejects an empty update', async () => {
    const response = await request(app).patch('/customers/1').send({});

    expect(response.status).toBe(400);
  });

  it('rejects an invalid customer ID', async () => {
    const response = await request(app).get('/customers/abc');

    expect(response.status).toBe(400);
  });

  it('returns 404 when a customer does not exist', async () => {
    jest
      .mocked(customerService.getCustomerById)
      .mockRejectedValue(new customerService.CustomerNotFoundError());

    const response = await request(app).get('/customers/999');

    expect(response.status).toBe(404);
  });

  it('returns 409 for a duplicate email', async () => {
    jest
      .mocked(customerService.createCustomer)
      .mockRejectedValue(new customerService.DuplicateCustomerEmailError());

    const response = await request(app)
      .post('/customers')
      .send({ name: 'Sunny Sharma', email: 'sunny@example.com' });

    expect(response.status).toBe(409);
  });

  it('returns 404 for an unknown route', async () => {
    const response = await request(app).get('/unknown-route');

    expect(response.status).toBe(404);
  });
});