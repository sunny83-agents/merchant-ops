import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
  });
});

// Handle unknown routes
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found.',
  });
});

export default app;
