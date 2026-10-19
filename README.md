# Merchant Ops

A backend application for managing customer records and building order and payment operations for small businesses.

## Overview

Merchant Ops is a Node.js backend built with TypeScript, Express, and PostgreSQL. The project currently includes customer management endpoints, database migrations, request validation, and automated tests.

The goal is to build the backend in small, maintainable modules as more business operations are added.

## Current Features

- Create and view customer records
- Update customer information
- Delete customer records
- Validate request data
- Prevent duplicate customer email addresses
- Store customer data in PostgreSQL
- Run database migrations
- Handle common API errors
- Test API behavior with Jest and Supertest

## Built With

- Node.js
- TypeScript
- Express
- PostgreSQL
- Zod
- Jest
- Supertest
- Docker

## Setup

### Requirements

- Node.js and npm
- Docker Desktop or a local PostgreSQL installation
- Git

### Install dependencies

```bash
git clone https://github.com/sunny83-agents/merchant-ops.git
cd merchant-ops
npm ci
```

### Configure the environment

Create a local environment file:

```bash
cp .env.example .env
```

Update the database settings in `.env` to match your local PostgreSQL configuration. Do not commit this file because it contains local configuration and may contain credentials.

### Start the database

Make sure PostgreSQL is running and the `merchant_ops` database is available.

Apply the migrations:

```bash
npm run migration:up
```

### Build and run

```bash
npm run build
npm start
```

The application uses port `3000` by default. The port can be changed through the environment configuration.

## API

Base URL: `http://localhost:3000`

### Health check

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check application and database connectivity |

### Customers

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/customers` | Create a customer |
| GET | `/customers` | List customers |
| GET | `/customers/:id` | Get a customer by ID |
| PATCH | `/customers/:id` | Update a customer |
| DELETE | `/customers/:id` | Delete a customer |

### Create a customer

Send a `POST` request to `/customers` with a JSON body:

```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "phone": "1234567890"
}
```

The phone field is optional. A successful request returns `201 Created` and the new customer record.

### Common response codes

- `200` — Request successful
- `201` — Customer created
- `204` — Customer deleted
- `400` — Invalid request
- `404` — Customer or route not found
- `409` — Email already exists
- `500` — Unexpected server error

## Development

Run the tests:

```bash
npm test -- --runInBand
```

Check linting:

```bash
npm run lint
```

Compile the project:

```bash
npm run build
```

## Current Status

Customer CRUD operations and PostgreSQL integration are implemented. Order management and payment processing are planned for future development.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
