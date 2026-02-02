import { asc, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, validateRequired } from '@/lib/api-utils.js'
import { getNextDisplayOrder } from '@/lib/db-helpers.js'

const { fixedExpenses } = schema

export const GET = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const expenses = await db
      .select({
        id: fixedExpenses.id,
        user_id: fixedExpenses.userId,
        label: fixedExpenses.label,
        amount: fixedExpenses.amount,
        frequency: fixedExpenses.frequency,
        currency: fixedExpenses.currency,
        exchange_rate: fixedExpenses.exchangeRate,
        display_order: fixedExpenses.displayOrder,
      })
      .from(fixedExpenses)
      .where(eq(fixedExpenses.userId, user.id))
      .orderBy(asc(fixedExpenses.displayOrder))

    return jsonSuccess(expenses)
  })
}

export const POST = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const body = await request.json()
    const { label, amount, frequency = 'monthly', currency = 'THB', exchange_rate = 1 } = body

    validateRequired(body, ['label', 'amount'])

    const displayOrder = await getNextDisplayOrder(fixedExpenses, user.id)

    const rows = await db
      .insert(fixedExpenses)
      .values({
        userId: user.id,
        label,
        amount,
        frequency,
        currency,
        exchangeRate: exchange_rate,
        displayOrder,
      })
      .returning({ id: fixedExpenses.id })

    const expense = {
      id: rows[0]?.id,
      user_id: user.id,
      label,
      amount,
      frequency,
      currency,
      exchange_rate,
      display_order: displayOrder,
    }

    return jsonSuccess(expense, 201)
  })
}
