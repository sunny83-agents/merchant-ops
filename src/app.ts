import express, { type NextFunction, type Request, type Response } from 'express';
import { pool } from './config/database';
import customerRoutes from './modules/customers/customer.routes';

const app = express();
app.use(express.json());
app.use('/customers', customerRoutes);
app.get('/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    next(error);
  }
});
// Temporary route for testing error handling
if (process.env.NODE_ENV === 'test') {
  app.get('/error-test', (_req, _res, next) => {
    next(new Error('Test internal error'));
  });
}
// Handle unknown routes
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found.',
  });
});

// Handle unexpected errors
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
  ) => {
    console.error(err.message);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.',
    });
  },
);

export default app;
