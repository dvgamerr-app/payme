import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess } from '@/lib/api-utils.js'
import { copyFixedExpensesToMonth } from '@/lib/db-helpers.js'

const { budgetCategories, monthlyBudgets, months } = schema

export const GET = async ({ cookies }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(cookies)

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const existingRows = await db
      .select({
        id: months.id,
        user_id: months.userId,
        year: months.year,
        month: months.month,
        is_closed: months.isClosed,
        closed_at: months.closedAt,
      })
      .from(months)
      .where(and(eq(months.userId, user.id), eq(months.year, year), eq(months.month, month)))
      .limit(1)
    let result = existingRows[0]

    if (!result) {
      const inserted = await db
        .insert(months)
        .values({ userId: user.id, year, month })
        .returning({ id: months.id })
      result = inserted[0]

      const categories = await db
        .select({ id: budgetCategories.id, default_amount: budgetCategories.defaultAmount })
        .from(budgetCategories)
        .where(eq(budgetCategories.userId, user.id))

      if (categories.length > 0) {
        await db.insert(monthlyBudgets).values(
          categories.map((category) => ({
            monthId: result.id,
            categoryId: category.id,
            allocatedAmount: category.default_amount,
          }))
        )
      }

      await copyFixedExpensesToMonth(result.id, user.id)
    }

    return jsonSuccess(result)
  })
}
