import { asc } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, validateRequired } from '@/lib/api-utils.js'

const { budgetCategories } = schema

export const GET = async ({ request }) => {
  return handleApiRequest(async () => {
    await requireAuth(request)
    const categories = await db
      .select({
        id: budgetCategories.id,
        label: budgetCategories.label,
        default_amount: budgetCategories.defaultAmount,
      })
      .from(budgetCategories)
      .orderBy(asc(budgetCategories.label))

    return jsonSuccess(categories)
  })
}

export const POST = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    if (user.role !== 'admin') return jsonError('Forbidden: admin only', 403)

    const body = await request.json()
    const { label, default_amount } = body

    validateRequired(body, ['label', 'default_amount'])

    const rows = await db
      .insert(budgetCategories)
      .values({ label, defaultAmount: default_amount })
      .returning({ id: budgetCategories.id })

    const category = {
      id: rows[0]?.id,
      label,
      default_amount,
    }

    return jsonSuccess(category, 201)
  })
}
