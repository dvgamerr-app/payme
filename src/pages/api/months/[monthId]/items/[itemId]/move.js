import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, parseIntParam, validateRequired } from '@/lib/api-utils.js'
import { getMonthByIdForUser } from '@/lib/db-helpers.js'

const { items, months } = schema

const verifyItemOwnership = async (itemId, userId) => {
  const checkRows = await db
    .select({ id: items.id, monthId: items.monthId })
    .from(items)
    .innerJoin(months, eq(months.id, items.monthId))
    .where(and(eq(items.id, itemId), eq(months.userId, userId)))
    .limit(1)

  if (!checkRows[0]) {
    throw new Error('Item not found')
  }
  return checkRows[0]
}

export const PUT = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const itemId = parseIntParam(params.itemId, 'item ID')
    const body = await request.json()
    const { target_month_id } = body

    validateRequired(body, ['target_month_id'])

    // ตรวจสอบว่า item เป็นของ user
    await verifyItemOwnership(itemId, user.id)

    // ตรวจสอบว่า target month เป็นของ user
    await getMonthByIdForUser(target_month_id, user.id)

    // อัพเดท monthId
    await db.update(items).set({ monthId: target_month_id }).where(eq(items.id, itemId))

    return jsonSuccess({ message: 'Item moved successfully' })
  })
}
