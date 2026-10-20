/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('orders', {
    id: 'id',

    customer_id: {
      type: 'bigint',
      notNull: true,
      references: 'customers',
      onDelete: 'RESTRICT',
    },

    status: {
      type: 'varchar(30)',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')",
    },

    total_amount: {
      type: 'numeric(12, 2)',
      notNull: true,
      check: 'total_amount >= 0',
    },

    currency: {
      type: 'varchar(3)',
      notNull: true,
      default: 'INR',
      check: "currency ~ '^[A-Z]{3}$'",
    },

    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },

    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('orders', 'customer_id');
  pgm.createIndex('orders', 'status');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('orders');
};