import { eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, parseIntParam } from '@/lib/api-utils.js'
import { verifyResourceOwnership } from '@/lib/db-helpers.js'

const { fixedExpenses } = schema

export const PUT = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const id = parseIntParam(params.id, 'fixed expense ID')
    const body = await request.json()
    const { label, amount, frequency, currency, exchange_rate } = body

    await verifyResourceOwnership(fixedExpenses, id, user.id, 'Fixed expense')

    const updates = {}
    if (label !== undefined) updates.label = label
    if (amount !== undefined) updates.amount = amount
    if (frequency !== undefined) updates.frequency = frequency
    if (currency !== undefined) updates.currency = currency
    if (exchange_rate !== undefined) updates.exchangeRate = exchange_rate

    if (Object.keys(updates).length === 0) {
      return jsonError('No fields to update', 400)
    }

    await db.update(fixedExpenses).set(updates).where(eq(fixedExpenses.id, id))

    const resultRows = await db
      .select({
        id: fixedExpenses.id,
        user_id: fixedExpenses.userId,
        label: fixedExpenses.label,
        amount: fixedExpenses.amount,
        frequency: fixedExpenses.frequency,
        currency: fixedExpenses.currency,
        exchange_rate: fixedExpenses.exchangeRate,
      })
      .from(fixedExpenses)
      .where(eq(fixedExpenses.id, id))
      .limit(1)

    return jsonSuccess(resultRows[0])
  })
}

export const DELETE = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const id = parseIntParam(params.id, 'fixed expense ID')

    await verifyResourceOwnership(fixedExpenses, id, user.id, 'Fixed expense')

    await db.delete(fixedExpenses).where(eq(fixedExpenses.id, id))

    return new Response(null, { status: 204 })
  })
}
