import { and, eq } from 'drizzle-orm'
import { db, nowSql, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, parseIntParam } from '@/lib/api-utils.js'

const { months } = schema

export const POST = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const id = parseIntParam(params.id, 'month ID')

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
      .where(and(eq(months.id, id), eq(months.userId, user.id)))
      .limit(1)
    const month = monthRows[0]

    if (!month) {
      throw new Error('Month not found')
    }

    if (month.is_closed) {
      return jsonError('Month already closed', 400)
    }

    const now = new Date()
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const currentDay = now.getDate()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    if (
      month.year !== currentYear ||
      month.month !== currentMonth ||
      currentDay !== lastDayOfMonth
    ) {
      return jsonError('Can only close month on the last day of the current calendar month', 400)
    }

    await db.update(months).set({ isClosed: true, closedAt: nowSql }).where(eq(months.id, id))

    const updatedRows = await db
      .select({
        id: months.id,
        user_id: months.userId,
        year: months.year,
        month: months.month,
        is_closed: months.isClosed,
        closed_at: months.closedAt,
      })
      .from(months)
      .where(and(eq(months.id, id), eq(months.userId, user.id)))
      .limit(1)
    const updatedMonth = { ...updatedRows[0], is_closed: Boolean(updatedRows[0].is_closed) }

    return jsonSuccess(updatedMonth)
  })
}
