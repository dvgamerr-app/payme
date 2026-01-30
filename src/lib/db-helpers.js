import { and, asc, desc, eq, sql } from 'drizzle-orm'
import logger from './logger.js'
import { db, schema } from './db.js'

const {
  budgetCategories,
  fixedExpenses,
  fixedMonths,
  incomeEntries,
  items,
  monthlyBudgets,
  months,
} = schema

export const getMonthSummary = async (monthId, userId) => {
  const monthRows = await db
    .select({
      id: months.id,
      user_id: months.userId,
      year: months.year,
      month: months.month,
      is_closed: months.isClosed,
      closed_at: months.closedAt,
    })
    .from(months)
    .where(and(eq(months.id, monthId), eq(months.userId, userId)))
    .limit(1)

  const month = monthRows[0]
  if (!month) return null

  month.is_closed = Boolean(month.is_closed)

  const income_entries = await db
    .select({
      id: incomeEntries.id,
      month_id: incomeEntries.monthId,
      label: incomeEntries.label,
      amount: incomeEntries.amount,
      display_order: incomeEntries.displayOrder,
    })
    .from(incomeEntries)
    .where(eq(incomeEntries.monthId, monthId))
    .orderBy(asc(incomeEntries.displayOrder))

  const fixed_expenses = await db
    .select({
      id: fixedMonths.id,
      month_id: fixedMonths.monthId,
      name: fixedMonths.name,
      amount: fixedMonths.amount,
      display_order: fixedMonths.displayOrder,
    })
    .from(fixedMonths)
    .where(eq(fixedMonths.monthId, monthId))
    .orderBy(asc(fixedMonths.displayOrder))

  const budgets = await db
    .select({
      id: monthlyBudgets.id,
      month_id: monthlyBudgets.monthId,
      category_id: monthlyBudgets.categoryId,
      category_label: budgetCategories.label,
      allocated_amount: monthlyBudgets.allocatedAmount,
      spent_amount: sql`COALESCE(SUM(${items.amount}), 0)`,
    })
    .from(monthlyBudgets)
    .innerJoin(budgetCategories, eq(budgetCategories.id, monthlyBudgets.categoryId))
    .leftJoin(
      items,
      and(
        eq(items.categoryId, monthlyBudgets.categoryId),
        eq(items.monthId, monthlyBudgets.monthId)
      )
    )
    .where(eq(monthlyBudgets.monthId, monthId))
    .groupBy(
      monthlyBudgets.id,
      monthlyBudgets.monthId,
      monthlyBudgets.categoryId,
      budgetCategories.label,
      monthlyBudgets.allocatedAmount
    )

  const itemsRows = await db
    .select({
      id: items.id,
      month_id: items.monthId,
      category_id: items.categoryId,
      description: items.description,
      amount: items.amount,
      spent_on: items.spentOn,
      category_label: budgetCategories.label,
    })
    .from(items)
    .innerJoin(budgetCategories, eq(budgetCategories.id, items.categoryId))
    .where(eq(items.monthId, monthId))
    .orderBy(desc(items.spentOn), desc(items.id))

  const total_income = income_entries.reduce((sum, e) => sum + e.amount, 0)
  const total_fixed = fixed_expenses.reduce((sum, e) => sum + e.amount, 0)
  const total_budgeted = budgets.reduce((sum, b) => sum + b.allocated_amount, 0)
  const total_spent = itemsRows.reduce((sum, i) => sum + i.amount, 0)
  const remaining = total_income - total_spent

  return {
    month,
    income_entries,
    fixed_expenses,
    budgets,
    items: itemsRows,
    total_income,
    total_fixed,
    total_budgeted,
    total_spent,
    remaining,
  }
}

export const getMonthByIdForUser = async (monthId, userId) => {
  const rows = await db
    .select({
      id: months.id,
      user_id: months.userId,
      year: months.year,
      month: months.month,
      is_closed: months.isClosed,
      closed_at: months.closedAt,
    })
    .from(months)
    .where(eq(months.id, monthId))
    .limit(1)

  const month = rows[0]

  if (!month) {
    throw new Error('Month not found')
  }

  if (month.user_id !== userId) {
    throw new Error('Month not found')
  }

  return month
}

export const getCategoryByIdForUser = async (categoryId, userId) => {
  const rows = await db
    .select({
      id: budgetCategories.id,
      user_id: budgetCategories.userId,
      label: budgetCategories.label,
      default_amount: budgetCategories.defaultAmount,
    })
    .from(budgetCategories)
    .where(eq(budgetCategories.id, categoryId))
    .limit(1)

  const category = rows[0]

  if (!category) {
    throw new Error('Category not found')
  }

  if (category.user_id !== userId) {
    throw new Error('Category not found')
  }

  return category
}

export const withTransaction = async (callback) => {
  try {
    const result = await callback(db)
    return result
  } catch (error) {
    // SQLite auto-rollback on error
    logger.error({ err: error }, 'Database transaction error')
    throw error
  }
}

export const getNextDisplayOrder = async (table, userId) => {
  const { desc } = await import('drizzle-orm')

  const rows = await db
    .select({ maxOrder: table.displayOrder })
    .from(table)
    .where(eq(table.userId, userId))
    .orderBy(desc(table.displayOrder))
    .limit(1)

  return rows[0]?.maxOrder ? rows[0].maxOrder + 1 : 0
}

export const verifyResourceOwnership = async (
  table,
  resourceId,
  userId,
  resourceName = 'Resource'
) => {
  const rows = await db
    .select({ id: table.id, user_id: table.userId })
    .from(table)
    .where(eq(table.id, resourceId))
    .limit(1)

  const resource = rows[0]

  if (!resource) {
    throw new Error(`${resourceName} not found`)
  }

  if (resource.user_id !== userId) {
    throw new Error(`${resourceName} not found`)
  }

  return resource
}

export const getFixedMonthsByMonthId = async (monthId, userId) => {
  const fixedMonthsRows = await db
    .select({
      id: fixedMonths.id,
      user_id: fixedMonths.userId,
      month_id: fixedMonths.monthId,
      name: fixedMonths.name,
      amount: fixedMonths.amount,
      display_order: fixedMonths.displayOrder,
      created_at: fixedMonths.createdAt,
      updated_at: fixedMonths.updatedAt,
    })
    .from(fixedMonths)
    .where(and(eq(fixedMonths.monthId, monthId), eq(fixedMonths.userId, userId)))
    .orderBy(asc(fixedMonths.displayOrder))

  return fixedMonthsRows
}

export const copyFixedExpensesToMonth = async (monthId, userId) => {
  const existingFixedExpenses = await db
    .select({
      label: fixedExpenses.label,
      amount: fixedExpenses.amount,
      frequency: fixedExpenses.frequency,
      currency: fixedExpenses.currency,
      exchange_rate: fixedExpenses.exchangeRate,
      display_order: fixedExpenses.displayOrder,
    })
    .from(fixedExpenses)
    .where(eq(fixedExpenses.userId, userId))
    .orderBy(asc(fixedExpenses.displayOrder))

  if (existingFixedExpenses.length > 0) {
    const fixedMonthsData = existingFixedExpenses.map((expense) => {
      const monthlyAmount = expense.frequency === 'yearly' ? expense.amount / 12 : expense.amount
      const exchangeRate = expense.exchange_rate || 1
      const finalAmount = monthlyAmount * exchangeRate

      return {
        userId,
        monthId,
        name: expense.label,
        amount: finalAmount,
        displayOrder: expense.display_order ?? 0,
      }
    })

    await db.insert(fixedMonths).values(fixedMonthsData)
  }
}

export const verifyFixedMonthOwnership = async (fixedMonthId, userId) => {
  const rows = await db
    .select({ id: fixedMonths.id, user_id: fixedMonths.userId })
    .from(fixedMonths)
    .where(eq(fixedMonths.id, fixedMonthId))
    .limit(1)

  const fixedMonth = rows[0]

  if (!fixedMonth) {
    throw new Error('Fixed month not found')
  }

  if (fixedMonth.user_id !== userId) {
    throw new Error('Fixed month not found')
  }

  return fixedMonth
}
