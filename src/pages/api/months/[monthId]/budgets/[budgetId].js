import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, validateRequired, parseIntParam } from '@/lib/api-utils.js'

const { monthlyBudgets, months } = schema

const verifyBudgetOwnership = async (budgetId, monthId, userId) => {
  const checkRows = await db
    .select({ id: monthlyBudgets.id })
    .from(monthlyBudgets)
    .innerJoin(months, eq(months.id, monthlyBudgets.monthId))
    .where(
      and(
        eq(monthlyBudgets.id, budgetId),
        eq(monthlyBudgets.monthId, monthId),
        eq(months.userId, userId)
      )
    )
    .limit(1)

  if (!checkRows[0]) {
    throw new Error('Budget not found')
  }
}

export const PUT = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'month ID')
    const budgetId = parseIntParam(params.budgetId, 'budget ID')
    const body = await request.json()
    const { allocated_amount } = body

    validateRequired(body, ['allocated_amount'])

    await verifyBudgetOwnership(budgetId, monthId, user.id)

    await db
      .update(monthlyBudgets)
      .set({ allocatedAmount: allocated_amount })
      .where(eq(monthlyBudgets.id, budgetId))

    const resultRows = await db
      .select({
        id: monthlyBudgets.id,
        month_id: monthlyBudgets.monthId,
        category_id: monthlyBudgets.categoryId,
        allocated_amount: monthlyBudgets.allocatedAmount,
      })
      .from(monthlyBudgets)
      .where(eq(monthlyBudgets.id, budgetId))
      .limit(1)

    return jsonSuccess(resultRows[0])
  })
}
