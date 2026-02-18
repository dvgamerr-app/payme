import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

const bytea = customType({
  dataType() {
    return 'bytea'
  },
})

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('user'), // 'admin' | 'user'
    savings: doublePrecision('savings').notNull().default(0),
    retirementSavings: doublePrecision('retirement_savings').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('users_username_unique').on(table.username)]
)

export const fixedExpenses = pgTable('fixed_expenses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  amount: doublePrecision('amount').notNull(),
  frequency: text('frequency').notNull().default('monthly'), // 'monthly' or 'yearly'
  currency: text('currency').notNull().default('THB'),
  exchangeRate: doublePrecision('exchange_rate').notNull().default(1),
  displayOrder: integer('display_order').notNull().default(0),
})

export const fixedMonths = pgTable(
  'fixed_months',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    amount: doublePrecision('amount').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_fixed_months_user_month').on(table.userId, table.monthId),
    index('idx_fixed_months_month').on(table.monthId),
  ]
)

export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  baseCurrency: text('base_currency').notNull().default('THB'),
  currencySymbol: text('currency_symbol').notNull().default('฿'),
  payday: text('payday').notNull().default('end'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const budgetCategories = pgTable('budget_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  defaultAmount: doublePrecision('default_amount').notNull(),
})

export const months = pgTable(
  'months',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    isClosed: boolean('is_closed').notNull().default(false),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('months_user_year_month_unique').on(table.userId, table.year, table.month),
    index('idx_months_user_year_month').on(table.userId, table.year, table.month),
  ]
)

export const incomeEntries = pgTable(
  'income_entries',
  {
    id: serial('id').primaryKey(),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    amount: doublePrecision('amount').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
  },
  (table) => [index('idx_income_month').on(table.monthId)]
)

export const monthlyBudgets = pgTable(
  'monthly_budgets',
  {
    id: serial('id').primaryKey(),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => budgetCategories.id, { onDelete: 'cascade' }),
    allocatedAmount: doublePrecision('allocated_amount').notNull(),
  },
  (table) => [
    uniqueIndex('monthly_budgets_month_category_unique').on(table.monthId, table.categoryId),
    index('idx_monthly_budgets_month').on(table.monthId),
  ]
)

export const items = pgTable(
  'items',
  {
    id: serial('id').primaryKey(),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => budgetCategories.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    amount: doublePrecision('amount').notNull(),
    spentOn: text('spent_on').notNull(),
  },
  (table) => [index('idx_items_month').on(table.monthId)]
)

export const monthlySnapshots = pgTable(
  'monthly_snapshots',
  {
    id: serial('id').primaryKey(),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    pdfData: bytea('pdf_data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('monthly_snapshots_month_unique').on(table.monthId)]
)

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id'),
    details: text('details'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_audit_user').on(table.userId)]
)

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_sessions_user').on(table.userId),
    index('idx_sessions_expires').on(table.expiresAt),
    uniqueIndex('idx_sessions_token').on(table.token),
  ]
)
