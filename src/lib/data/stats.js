import { and, asc, desc, eq, gte, inArray, or, sql } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'

const { budgetCategories, fixedMonths, incomeEntries, items, months, users } = schema

export async function getStatsData(user) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const prevYear = currentYear - 1

  const categories = await db
    .select({ id: budgetCategories.id, label: budgetCategories.label })
    .from(budgetCategories)
    .orderBy(asc(budgetCategories.label))

  // Current year spending (YTD - Year to Date)
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
        sql`${months.month} <= ${currentMonth}`
      )
    )
    .groupBy(items.categoryId)

  // Previous year spending (same period)
  const prevSpent = await db
    .select({
      category_id: items.categoryId,
      amount: sql`COALESCE(SUM(${items.amount}), 0)`,
    })
    .from(items)
    .innerJoin(months, eq(months.id, items.monthId))
    .where(
      and(
        eq(months.userId, user.id),
        eq(months.year, prevYear),
        sql`${months.month} <= ${currentMonth}`
      )
    )
    .groupBy(items.categoryId)

  const currentMap = new Map(currentSpent.map((row) => [row.category_id, Number(row.amount || 0)]))
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
    .where(
      and(
        eq(months.userId, user.id),
        or(
          sql`${months.year} < ${currentYear}`,
          and(sql`${months.year} = ${currentYear}`, sql`${months.month} <= ${currentMonth}`)
        )
      )
    )
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

  // Query fixedMonths for current month and onwards logic
  const fixedMonthsRows = await db
    .select({
      amount: fixedMonths.amount,
    })
    .from(fixedMonths)
    .innerJoin(months, eq(months.id, fixedMonths.monthId))
    .where(
      and(
        eq(months.userId, user.id),
        or(
          gte(months.year, currentYear + 1),
          and(eq(months.year, currentYear), gte(months.month, currentMonth))
        )
      )
    )
  const totalFixed = fixedMonthsRows.reduce((sum, e) => sum + e.amount, 0)

  // Use fixedMonths data for historical if needed?
  // Current logic for trends seems to use just total_spent / total_income
  // It seems 'total_fixed' is constant 'totalFixed' for all months in the API response currently?
  // Replicating existing logic:

  const monthly_trends = monthRows.map((row) => {
    const total_income = incomeByMonth.get(row.id) ?? 0
    const total_spent = spentByMonth.get(row.id) ?? 0
    const total_fixed = totalFixed // Existing logic uses current fixed for all? Or should it vary?
    // The original API code used 'totalFixed' calculated for *current month* as a constant for the trend chart?
    // Let's check the original code again.
    // Line 135: const total_fixed = totalFixed
    // Yes, it uses the current fixed expenses for all months in the trend.
    // This might be imperfect but I will strictly replicate it for now to avoid logic changes.
    return {
      year: row.year,
      month: row.month,
      total_income,
      total_spent,
      total_fixed,
      net: total_income - total_spent - total_fixed,
    }
  })

  // Reverse to show oldest first in chart if needed?
  // API returned desc order (newest first).
  // Charts usually want chronological (oldest first).
  // The API just returned monthRows (desc).
  // I'll return as is, let visual component handle sorting if needed.
  // Actually, TrendChart usually reads Left->Right = Old->New.
  // I'll reverse it here? No, let's keep data raw.
  // Wait, if I reverse here, I change API behavior.
  // I will reverse it in the Chart component or specific page logic.
  // Actually, for the Stats page, I want chronological.

  const average_monthly_spending =
    monthly_trends.length > 0
      ? monthly_trends.reduce((sum, m) => sum + m.total_spent, 0) / monthly_trends.length
      : 0
  const average_monthly_income =
    monthly_trends.length > 0
      ? monthly_trends.reduce((sum, m) => sum + m.total_income, 0) / monthly_trends.length
      : 0

  return {
    category_comparisons,
    monthly_trends, // Descending (Newest first)
    average_monthly_spending,
    average_monthly_income,
  }
}

/**
 * Get stats data for ALL users (admin view)
 * Returns per-user monthly trends and a combined aggregate trend
 */
export async function getAllUsersStatsData() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Get all users
  const allUsers = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .orderBy(asc(users.id))

  // Get last 12 months per user (exclude future months) — no global limit to avoid truncating users
  const allMonthRows = await db
    .select({ id: months.id, userId: months.userId, year: months.year, month: months.month })
    .from(months)
    .where(
      or(
        sql`${months.year} < ${currentYear}`,
        and(sql`${months.year} = ${currentYear}`, sql`${months.month} <= ${currentMonth}`)
      )
    )
    .orderBy(desc(months.year), desc(months.month))

  // Slice 12 months per user, collect only needed monthIds
  const perUserMonths = new Map()
  for (const u of allUsers) {
    const userMonths = allMonthRows.filter((r) => r.userId === u.id).slice(0, 12)
    perUserMonths.set(u.id, userMonths)
  }

  const neededMonthIds = [
    ...new Set([...perUserMonths.values()].flatMap((rows) => rows.map((r) => r.id))),
  ]

  // Income by monthId
  const incomeByMonth = new Map()
  // Spent by monthId
  const spentByMonth = new Map()

  if (neededMonthIds.length > 0) {
    const incomeRows = await db
      .select({
        month_id: incomeEntries.monthId,
        total_income: sql`COALESCE(SUM(${incomeEntries.amount}), 0)`,
      })
      .from(incomeEntries)
      .where(inArray(incomeEntries.monthId, neededMonthIds))
      .groupBy(incomeEntries.monthId)
    for (const row of incomeRows) incomeByMonth.set(row.month_id, Number(row.total_income || 0))

    const spentRows = await db
      .select({
        month_id: items.monthId,
        total_spent: sql`COALESCE(SUM(${items.amount}), 0)`,
      })
      .from(items)
      .where(inArray(items.monthId, neededMonthIds))
      .groupBy(items.monthId)
    for (const row of spentRows) spentByMonth.set(row.month_id, Number(row.total_spent || 0))
  }

  // Build per-user trends (last 12 months per user)
  const users_trends = allUsers.map((u) => {
    const userMonths = perUserMonths.get(u.id) ?? []

    const monthly_trends = userMonths.map((row) => ({
      year: row.year,
      month: row.month,
      total_income: incomeByMonth.get(row.id) ?? 0,
      total_spent: spentByMonth.get(row.id) ?? 0,
    }))

    const avg_spending =
      monthly_trends.length > 0
        ? monthly_trends.reduce((s, m) => s + m.total_spent, 0) / monthly_trends.length
        : 0
    const avg_income =
      monthly_trends.length > 0
        ? monthly_trends.reduce((s, m) => s + m.total_income, 0) / monthly_trends.length
        : 0

    return {
      user_id: u.id,
      username: u.username,
      monthly_trends, // Descending (newest first) — reversed client-side
      average_monthly_spending: avg_spending,
      average_monthly_income: avg_income,
    }
  })

  // Build combined trend: aggregate income+spent per (year, month) across per-user months
  const combinedMap = new Map()
  for (const userMonths of perUserMonths.values()) {
    for (const row of userMonths) {
      const key = `${row.year}-${String(row.month).padStart(2, '0')}`
      if (!combinedMap.has(key))
        combinedMap.set(key, { year: row.year, month: row.month, total_income: 0, total_spent: 0 })
      const entry = combinedMap.get(key)
      entry.total_income += incomeByMonth.get(row.id) ?? 0
      entry.total_spent += spentByMonth.get(row.id) ?? 0
    }
  }

  // Sort descending (newest first), take last 12 distinct months
  const combined_trends = Array.from(combinedMap.values())
    .sort((a, b) => b.year - a.year || b.month - a.month)
    .slice(0, 12)

  const combined_avg_spending =
    combined_trends.length > 0
      ? combined_trends.reduce((s, m) => s + m.total_spent, 0) / combined_trends.length
      : 0
  const combined_avg_income =
    combined_trends.length > 0
      ? combined_trends.reduce((s, m) => s + m.total_income, 0) / combined_trends.length
      : 0

  return {
    users_trends,
    combined_trends, // Descending (newest first) — reversed client-side
    combined_avg_spending,
    combined_avg_income,
  }
}
