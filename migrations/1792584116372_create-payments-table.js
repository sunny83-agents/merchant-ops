
/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable('payments', {
    id: 'id',

    order_id: {
      type: 'bigint',
      notNull: true,
      references: 'orders',
      onDelete: 'RESTRICT',
    },

    amount: {
      type: 'numeric(12, 2)',
      notNull: true,
      check: 'amount > 0',
    },

    currency: {
      type: 'varchar(3)',
      notNull: true,
      check: "currency ~ '^[A-Z]{3}$'",
    },

    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'succeeded', 'failed')",
    },

    provider_reference: {
      type: 'varchar(255)',
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

  pgm.createIndex('payments', 'order_id');
  pgm.createIndex('payments', 'status');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable('payments');
};

