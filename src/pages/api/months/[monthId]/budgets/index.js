import { and, asc, eq, sql } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, parseIntParam } from '@/lib/api-utils.js'
import { getMonthByIdForUser } from '@/lib/db-helpers.js'

const { budgetCategories, items, monthlyBudgets } = schema

export const GET = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'month ID')

    await getMonthByIdForUser(monthId, user.id)

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
      .orderBy(asc(budgetCategories.label))

    return jsonSuccess(budgets)
  })
}
