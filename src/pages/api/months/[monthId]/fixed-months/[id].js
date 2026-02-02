import { eq, sql } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, parseIntParam } from '@/lib/api-utils.js'
import { verifyFixedMonthOwnership } from '@/lib/db-helpers.js'

const { fixedMonths } = schema

export const PUT = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const id = parseIntParam(params.id, 'fixed month ID')
    const body = await request.json()
    const { name, amount } = body

    await verifyFixedMonthOwnership(id, user.id)

    const updates = {}
    if (name !== undefined) updates.name = name
    if (amount !== undefined) updates.amount = amount
    updates.updatedAt = sql`CURRENT_TIMESTAMP`

    if (Object.keys(updates).length === 1) {
      return jsonError('No fields to update', 400)
    }

    await db.update(fixedMonths).set(updates).where(eq(fixedMonths.id, id))

    const resultRows = await db
      .select({
        id: fixedMonths.id,
        user_id: fixedMonths.userId,
        month_id: fixedMonths.monthId,
        name: fixedMonths.name,
        amount: fixedMonths.amount,
        display_order: fixedMonths.displayOrder,
        created_at: fixedMonths.createdAt,
        updated_at: fixedMonths.updatedAt,
      })
      .from(fixedMonths)
      .where(eq(fixedMonths.id, id))
      .limit(1)

    return jsonSuccess(resultRows[0])
  })
}

export const DELETE = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const id = parseIntParam(params.id, 'fixed month ID')

    await verifyFixedMonthOwnership(id, user.id)

    await db.delete(fixedMonths).where(eq(fixedMonths.id, id))

    return new Response(null, { status: 204 })
  })
}
