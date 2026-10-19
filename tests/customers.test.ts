import request from 'supertest';
import { jest } from '@jest/globals';

jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    on: jest.fn(),
  },
}));

import app from '../src/app';

describe('Customer API', () => {
  it('returns 404 for an unknown route', async () => {
    const response = await request(app).get('/unknown-route');

    expect(response.status).toBe(404);
  });

  it('returns 400 when creating a customer with invalid data', async () => {
    const response = await request(app)
      .post('/customers')
      .send({ name: '', email: 'not-an-email' });

    expect(response.status).toBe(400);
  });

  it('returns 400 when updating a customer with an empty body', async () => {
    const response = await request(app)
      .patch('/customers/1')
      .send({});

    expect(response.status).toBe(400);
  });
});
