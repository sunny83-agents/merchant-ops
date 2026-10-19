import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid port number between 1 and 65535');
}

const databaseHost = process.env.DB_HOST ?? '127.0.0.1';
const databasePort = Number(process.env.DB_PORT ?? 5432);
const databaseName = process.env.DB_NAME ?? 'merchant_ops';
const databaseUser = process.env.DB_USER ?? 'merchant_ops';
const databasePassword =
  process.env.DB_PASSWORD ?? 'merchant_ops_dev_password';

if (
  !Number.isInteger(databasePort) ||
  databasePort < 1 ||
  databasePort > 65535
) {
  throw new Error('DB_PORT must be a valid port number between 1 and 65535');
}

export const env = {
  port,
  database: {
    host: databaseHost,
    port: databasePort,
    name: databaseName,
    user: databaseUser,
    password: databasePassword,
  },
};
