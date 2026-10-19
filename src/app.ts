import express, { type NextFunction, type Request, type Response } from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
  });
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
