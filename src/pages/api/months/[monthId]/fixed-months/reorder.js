import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, parseIntParam } from '@/lib/api-utils.js'
import { getMonthByIdForUser } from '@/lib/db-helpers.js'

const { fixedMonths } = schema

export const PUT = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'monthId')
    const body = await request.json()
    const { order } = body

    if (!Array.isArray(order) || order.length === 0) {
      return jsonError('Order array required', 400)
    }

    await getMonthByIdForUser(monthId, user.id)

    const monthFixedExpenses = await db
      .select({ id: fixedMonths.id })
      .from(fixedMonths)
      .where(and(eq(fixedMonths.monthId, monthId), eq(fixedMonths.userId, user.id)))

    const monthFixedExpenseIds = new Set(monthFixedExpenses.map((e) => e.id))
    const allValid = order.every((id) => monthFixedExpenseIds.has(id))

    if (!allValid) {
      return jsonError('Invalid fixed month IDs', 403)
    }

    for (let i = 0; i < order.length; i++) {
      await db.update(fixedMonths).set({ displayOrder: i }).where(eq(fixedMonths.id, order[i]))
    }

    return jsonSuccess({ success: true })
  })
}
