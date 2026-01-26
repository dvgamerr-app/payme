import { asc, desc, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, validateRequired, parseIntParam } from '@/lib/api-utils.js'
import { getMonthByIdForUser } from '@/lib/db-helpers.js'

const { incomeEntries } = schema

export const GET = async ({ params, cookies }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(cookies)
    const monthId = parseIntParam(params.monthId, 'month ID')

    await getMonthByIdForUser(monthId, user.id)

    const entries = await db
      .select({
        id: incomeEntries.id,
        month_id: incomeEntries.monthId,
        label: incomeEntries.label,
        amount: incomeEntries.amount,
      })
      .from(incomeEntries)
      .where(eq(incomeEntries.monthId, monthId))
      .orderBy(asc(incomeEntries.displayOrder))

    return jsonSuccess(entries)
  })
}

export const POST = async ({ params, request, cookies }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(cookies)
    const monthId = parseIntParam(params.monthId, 'month ID')
    const body = await request.json()
    const { label, amount } = body

    validateRequired(body, ['label', 'amount'])

    await getMonthByIdForUser(monthId, user.id)

    const displayOrder = await db
      .select({ maxOrder: incomeEntries.displayOrder })
      .from(incomeEntries)
      .where(eq(incomeEntries.monthId, monthId))
      .orderBy(desc(incomeEntries.displayOrder))
      .limit(1)
      .then((rows) => (rows[0]?.maxOrder ? rows[0].maxOrder + 1 : 0))

    const rows = await db
      .insert(incomeEntries)
      .values({ monthId, label, amount, displayOrder })
      .returning({ id: incomeEntries.id })

    const entry = {
      id: rows[0]?.id,
      month_id: monthId,
      label,
      amount,
    }

    return jsonSuccess(entry, 201)
  })
}
