import { eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, parseIntParam } from '@/lib/api-utils.js'

const { budgetCategories } = schema

export const PUT = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    if (user.role !== 'admin') return jsonError('Forbidden: admin only', 403)

    const id = parseIntParam(params.id, 'category ID')
    const body = await request.json()
    const { label, default_amount } = body

    const existing = await db
      .select({ id: budgetCategories.id })
      .from(budgetCategories)
      .where(eq(budgetCategories.id, id))
      .limit(1)
    if (!existing.length) return jsonError('Category not found', 404)

    const updates = {}
    if (label !== undefined) updates.label = label
    if (default_amount !== undefined) updates.defaultAmount = default_amount

    if (Object.keys(updates).length === 0) {
      return jsonError('No fields to update', 400)
    }

    await db.update(budgetCategories).set(updates).where(eq(budgetCategories.id, id))

    const resultRows = await db
      .select({
        id: budgetCategories.id,
        user_id: budgetCategories.userId,
        label: budgetCategories.label,
        default_amount: budgetCategories.defaultAmount,
      })
      .from(budgetCategories)
      .where(eq(budgetCategories.id, id))
      .limit(1)

    return jsonSuccess(resultRows[0])
  })
}

export const DELETE = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    if (user.role !== 'admin') return jsonError('Forbidden: admin only', 403)

    const id = parseIntParam(params.id, 'category ID')

    const existing = await db
      .select({ id: budgetCategories.id })
      .from(budgetCategories)
      .where(eq(budgetCategories.id, id))
      .limit(1)
    if (!existing.length) return jsonError('Category not found', 404)

    await db.delete(budgetCategories).where(eq(budgetCategories.id, id))

    return new Response(null, { status: 204 })
  })
}
