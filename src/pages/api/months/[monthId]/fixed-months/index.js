import { and, asc, desc, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, validateRequired, parseIntParam } from '@/lib/api-utils.js'
import { getMonthByIdForUser, copyFixedExpensesToMonth } from '@/lib/db-helpers.js'

const { fixedMonths } = schema

export const GET = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'monthId')

    const month = await getMonthByIdForUser(monthId, user.id)

    let fixed_months = await db
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
      .where(and(eq(fixedMonths.monthId, monthId), eq(fixedMonths.userId, user.id)))
      .orderBy(asc(fixedMonths.displayOrder))

    // Auto-populate from fixed expenses if empty and month is in the past
    if (fixed_months.length === 0) {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      const monthDate = new Date(month.year, month.month - 1)
      const currentDate = new Date(currentYear, currentMonth - 1)

      if (monthDate < currentDate) {
        await copyFixedExpensesToMonth(monthId, user.id)

        fixed_months = await db
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
          .where(and(eq(fixedMonths.monthId, monthId), eq(fixedMonths.userId, user.id)))
          .orderBy(asc(fixedMonths.displayOrder))
      }
    }

    return jsonSuccess(fixed_months)
  })
}

export const POST = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'monthId')
    const body = await request.json()
    const { name, amount } = body

    validateRequired(body, ['name', 'amount'])

    await getMonthByIdForUser(monthId, user.id)

    const displayOrder = await db
      .select({ maxOrder: fixedMonths.displayOrder })
      .from(fixedMonths)
      .where(and(eq(fixedMonths.monthId, monthId), eq(fixedMonths.userId, user.id)))
      .orderBy(desc(fixedMonths.displayOrder))
      .limit(1)
      .then((rows) => (rows[0]?.maxOrder ? rows[0].maxOrder + 1 : 0))

    const rows = await db
      .insert(fixedMonths)
      .values({
        userId: user.id,
        monthId,
        name,
        amount,
        displayOrder,
      })
      .returning({ id: fixedMonths.id })

    const fixed_month = {
      id: rows[0]?.id,
      user_id: user.id,
      month_id: monthId,
      name,
      amount,
      display_order: displayOrder,
    }

    return jsonSuccess(fixed_month, 201)
  })
}
