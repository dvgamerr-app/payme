import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, parseIntParam } from '@/lib/api-utils.js'

const { incomeEntries, months } = schema

const verifyIncomeOwnership = async (incomeId, monthId, userId) => {
  const checkRows = await db
    .select({ id: incomeEntries.id })
    .from(incomeEntries)
    .innerJoin(months, eq(months.id, incomeEntries.monthId))
    .where(
      and(
        eq(incomeEntries.id, incomeId),
        eq(incomeEntries.monthId, monthId),
        eq(months.userId, userId)
      )
    )
    .limit(1)

  if (!checkRows[0]) {
    throw new Error('Income not found')
  }
}

export const PUT = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'month ID')
    const id = parseIntParam(params.id, 'income ID')
    const body = await request.json()
    const { label, amount } = body

    await verifyIncomeOwnership(id, monthId, user.id)

    const updates = {}
    if (label !== undefined) updates.label = label
    if (amount !== undefined) updates.amount = amount

    if (Object.keys(updates).length === 0) {
      return jsonError('No fields to update', 400)
    }

    await db.update(incomeEntries).set(updates).where(eq(incomeEntries.id, id))

    const resultRows = await db
      .select({
        id: incomeEntries.id,
        month_id: incomeEntries.monthId,
        label: incomeEntries.label,
        amount: incomeEntries.amount,
      })
      .from(incomeEntries)
      .where(eq(incomeEntries.id, id))
      .limit(1)

    return jsonSuccess(resultRows[0])
  })
}

export const DELETE = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'month ID')
    const id = parseIntParam(params.id, 'income ID')

    await verifyIncomeOwnership(id, monthId, user.id)

    await db.delete(incomeEntries).where(eq(incomeEntries.id, id))

    return new Response(null, { status: 204 })
  })
}
