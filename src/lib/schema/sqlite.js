import { sql } from 'drizzle-orm'
import { blob, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('user'), // 'admin' | 'user'
    savings: real('savings').notNull().default(0),
    retirementSavings: real('retirement_savings').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex('users_username_unique').on(table.username)]
)

export const fixedExpenses = sqliteTable('fixed_expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  amount: real('amount').notNull(),
  frequency: text('frequency').notNull().default('monthly'), // 'monthly' or 'yearly'
  currency: text('currency').notNull().default('THB'),
  exchangeRate: real('exchange_rate').notNull().default(1),
  displayOrder: integer('display_order').notNull().default(0),
})

export const fixedMonths = sqliteTable(
  'fixed_months',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    amount: real('amount').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_fixed_months_user_month').on(table.userId, table.monthId),
    index('idx_fixed_months_month').on(table.monthId),
  ]
)

export const userSettings = sqliteTable('user_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  baseCurrency: text('base_currency').notNull().default('THB'),
  currencySymbol: text('currency_symbol').notNull().default('฿'),
  payday: text('payday').notNull().default('end'), // 'end', '25', '28'
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

export const budgetCategories = sqliteTable('budget_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  defaultAmount: real('default_amount').notNull(),
})

export const months = sqliteTable(
  'months',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    isClosed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
    closedAt: text('closed_at'),
  },
  (table) => [
    uniqueIndex('months_user_year_month_unique').on(table.userId, table.year, table.month),
    index('idx_months_user_year_month').on(table.userId, table.year, table.month),
  ]
)

export const incomeEntries = sqliteTable(
  'income_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    amount: real('amount').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
  },
  (table) => [index('idx_income_month').on(table.monthId)]
)

export const monthlyBudgets = sqliteTable(
  'monthly_budgets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => budgetCategories.id, { onDelete: 'cascade' }),
    allocatedAmount: real('allocated_amount').notNull(),
  },
  (table) => [
    uniqueIndex('monthly_budgets_month_category_unique').on(table.monthId, table.categoryId),
    index('idx_monthly_budgets_month').on(table.monthId),
  ]
)

export const items = sqliteTable(
  'items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => budgetCategories.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    amount: real('amount').notNull(),
    spentOn: text('spent_on').notNull(),
  },
  (table) => [index('idx_items_month').on(table.monthId)]
)

export const monthlySnapshots = sqliteTable(
  'monthly_snapshots',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    monthId: integer('month_id')
      .notNull()
      .references(() => months.id, { onDelete: 'cascade' }),
    pdfData: blob('pdf_data').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex('monthly_snapshots_month_unique').on(table.monthId)]
)

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id'),
    details: text('details'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_audit_user').on(table.userId)]
)

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    expiresAt: text('expires_at').notNull(),
  },
  (table) => [
    index('idx_sessions_user').on(table.userId),
    index('idx_sessions_expires').on(table.expiresAt),
    uniqueIndex('idx_sessions_token').on(table.token),
  ]
)
