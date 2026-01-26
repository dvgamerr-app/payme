import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess } from '@/lib/api-utils.js'

const { budgetCategories, fixedExpenses, incomeEntries, items, months } = schema

export const GET = async ({ cookies }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(cookies)

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    let prevYear = currentYear
    let prevMonth = currentMonth - 1
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear--
    }

    const categories = await db
      .select({ id: budgetCategories.id, label: budgetCategories.label })
      .from(budgetCategories)
      .where(eq(budgetCategories.userId, user.id))
      .orderBy(asc(budgetCategories.label))

    const currentSpent = await db
      .select({
        category_id: items.categoryId,
        amount: sql`COALESCE(SUM(${items.amount}), 0)`,
      })
      .from(items)
      .innerJoin(months, eq(months.id, items.monthId))
      .where(
        and(
          eq(months.userId, user.id),
          eq(months.year, currentYear),
          eq(months.month, currentMonth)
        )
      )
      .groupBy(items.categoryId)

    const prevSpent = await db
      .select({
        category_id: items.categoryId,
        amount: sql`COALESCE(SUM(${items.amount}), 0)`,
      })
      .from(items)
      .innerJoin(months, eq(months.id, items.monthId))
      .where(
        and(eq(months.userId, user.id), eq(months.year, prevYear), eq(months.month, prevMonth))
      )
      .groupBy(items.categoryId)

    const currentMap = new Map(
      currentSpent.map((row) => [row.category_id, Number(row.amount || 0)])
    )
    const prevMap = new Map(prevSpent.map((row) => [row.category_id, Number(row.amount || 0)]))

    const category_comparisons = categories.map((category) => {
      const currentAmount = currentMap.get(category.id) ?? 0
      const prevAmount = prevMap.get(category.id) ?? 0
      const changeAmount = currentAmount - prevAmount
      const changePercent = prevAmount === 0 ? null : (changeAmount / prevAmount) * 100
      return {
        category_id: category.id,
        category_label: category.label,
        current_month_spent: currentAmount,
        previous_month_spent: prevAmount,
        change_amount: changeAmount,
        change_percent: changePercent,
      }
    })

    const monthRows = await db
      .select({ id: months.id, year: months.year, month: months.month })
      .from(months)
      .where(eq(months.userId, user.id))
      .orderBy(desc(months.year), desc(months.month))
      .limit(12)

    const monthIds = monthRows.map((row) => row.id)
    const incomeByMonth = new Map()
    const spentByMonth = new Map()

    if (monthIds.length > 0) {
      const incomeRows = await db
        .select({
          month_id: incomeEntries.monthId,
          total_income: sql`COALESCE(SUM(${incomeEntries.amount}), 0)`,
        })
        .from(incomeEntries)
        .where(inArray(incomeEntries.monthId, monthIds))
        .groupBy(incomeEntries.monthId)
      for (const row of incomeRows) {
        incomeByMonth.set(row.month_id, Number(row.total_income || 0))
      }

      const spentRows = await db
        .select({
          month_id: items.monthId,
          total_spent: sql`COALESCE(SUM(${items.amount}), 0)`,
        })
        .from(items)
        .where(inArray(items.monthId, monthIds))
        .groupBy(items.monthId)
      for (const row of spentRows) {
        spentByMonth.set(row.month_id, Number(row.total_spent || 0))
      }
    }

    const fixedExpensesRows = await db
      .select({
        amount: fixedExpenses.amount,
        frequency: fixedExpenses.frequency,
        exchange_rate: fixedExpenses.exchangeRate,
      })
      .from(fixedExpenses)
      .where(eq(fixedExpenses.userId, user.id))
    const totalFixed = fixedExpensesRows.reduce((sum, e) => {
      const monthlyAmount = e.frequency === 'yearly' ? e.amount / 12 : e.amount
      const exchangeRate = e.exchange_rate || 1
      return sum + monthlyAmount * exchangeRate
    }, 0)

    const monthly_trends = monthRows.map((row) => {
      const total_income = incomeByMonth.get(row.id) ?? 0
      const total_spent = spentByMonth.get(row.id) ?? 0
      const total_fixed = totalFixed
      return {
        year: row.year,
        month: row.month,
        total_income,
        total_spent,
        total_fixed,
        net: total_income - total_spent - total_fixed,
      }
    })

    const average_monthly_spending =
      monthly_trends.length > 0
        ? monthly_trends.reduce((sum, m) => sum + m.total_spent, 0) / monthly_trends.length
        : 0
    const average_monthly_income =
      monthly_trends.length > 0
        ? monthly_trends.reduce((sum, m) => sum + m.total_income, 0) / monthly_trends.length
        : 0

    return jsonSuccess({
      category_comparisons,
      monthly_trends,
      average_monthly_spending,
      average_monthly_income,
    })
  })
}
