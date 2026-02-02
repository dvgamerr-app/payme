import { eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError } from '@/lib/api-utils.js'

const { fixedExpenses } = schema

export const PUT = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const body = await request.json()
    const { order } = body

    if (!Array.isArray(order) || order.length === 0) {
      return jsonError('Order array required', 400)
    }

    const userExpenses = await db
      .select({ id: fixedExpenses.id })
      .from(fixedExpenses)
      .where(eq(fixedExpenses.userId, user.id))

    const userExpenseIds = new Set(userExpenses.map((e) => e.id))
    const allValid = order.every((id) => userExpenseIds.has(id))

    if (!allValid) {
      return jsonError('Invalid expense IDs', 403)
    }

    for (let i = 0; i < order.length; i++) {
      await db.update(fixedExpenses).set({ displayOrder: i }).where(eq(fixedExpenses.id, order[i]))
    }

    return jsonSuccess({ success: true })
  })
}
