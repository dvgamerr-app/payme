import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, parseIntParam } from '@/lib/api-utils.js'
import { getCategoryByIdForUser } from '@/lib/db-helpers.js'

const { items, months } = schema

const verifyItemOwnership = async (itemId, monthId, userId) => {
  const checkRows = await db
    .select({ id: items.id })
    .from(items)
    .innerJoin(months, eq(months.id, items.monthId))
    .where(and(eq(items.id, itemId), eq(items.monthId, monthId), eq(months.userId, userId)))
    .limit(1)

  if (!checkRows[0]) {
    throw new Error('Item not found')
  }
}

export const PUT = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'month ID')
    const itemId = parseIntParam(params.itemId, 'item ID')
    const body = await request.json()
    const { category_id, description, amount, spent_on } = body

    await verifyItemOwnership(itemId, monthId, user.id)

    if (category_id !== undefined) {
      await getCategoryByIdForUser(category_id, user.id)
    }

    const updates = {}
    if (category_id !== undefined) updates.categoryId = category_id
    if (description !== undefined) updates.description = description
    if (amount !== undefined) updates.amount = amount
    if (spent_on !== undefined) updates.spentOn = spent_on

    if (Object.keys(updates).length === 0) {
      return jsonError('No fields to update', 400)
    }

    await db.update(items).set(updates).where(eq(items.id, itemId))

    const resultRows = await db
      .select({
        id: items.id,
        month_id: items.monthId,
        category_id: items.categoryId,
        description: items.description,
        amount: items.amount,
        spent_on: items.spentOn,
      })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1)

    return jsonSuccess(resultRows[0])
  })
}

export const DELETE = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'month ID')
    const itemId = parseIntParam(params.itemId, 'item ID')

    await verifyItemOwnership(itemId, monthId, user.id)

    await db.delete(items).where(eq(items.id, itemId))

    return new Response(null, { status: 204 })
  })
}
