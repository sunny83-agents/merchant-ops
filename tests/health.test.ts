import request from 'supertest';
import app from '../src/app';

describe('GET /health', () => {
  it('returns a healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
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
