import { eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, parseIntParam } from '@/lib/api-utils.js'
import { getMonthByIdForUser } from '@/lib/db-helpers.js'

const { incomeEntries } = schema

export const PUT = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'month ID')
    const body = await request.json()
    const { order } = body

    if (!Array.isArray(order) || order.length === 0) {
      return jsonError('Order array required', 400)
    }

    await getMonthByIdForUser(monthId, user.id)

    const monthIncomeEntries = await db
      .select({ id: incomeEntries.id })
      .from(incomeEntries)
      .where(eq(incomeEntries.monthId, monthId))

    const monthIncomeIds = new Set(monthIncomeEntries.map((e) => e.id))
    const allValid = order.every((id) => monthIncomeIds.has(id))

    if (!allValid) {
      return jsonError('Invalid income entry IDs', 403)
    }

    for (let i = 0; i < order.length; i++) {
      await db.update(incomeEntries).set({ displayOrder: i }).where(eq(incomeEntries.id, order[i]))
    }

    return jsonSuccess({ success: true })
  })
}
