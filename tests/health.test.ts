jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    on: jest.fn(),
  },
}));

import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/config/database';

const mockQuery = jest.mocked(pool.query);

describe('GET /health', () => {
  beforeEach(() => {
    mockQuery.mockResolvedValue({ rows: [{ '?column?': 1 }] } as never);
  });

  it('returns a healthy status when the database is connected', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected',
    });
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns 500 when the database connection fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Database unavailable'));

    const response = await request(app).get('/health');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.',
    });
  });

  it('returns 404 for an unknown route', async () => {
    const response = await request(app).get('/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'Not Found',
      message: 'The requested resource was not found.',
    });
  });

  it('returns a safe JSON response for unexpected errors', async () => {
    const response = await request(app).get('/error-test');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.',
    });
    expect(JSON.stringify(response.body)).not.toContain('Test internal error');
  });
});
