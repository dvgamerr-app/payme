import { eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, validateRequired } from '@/lib/api-utils.js'

const { users } = schema

export const GET = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const rows = await db
      .select({ retirement_savings: users.retirementSavings })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    return jsonSuccess({ retirement_savings: rows[0]?.retirement_savings || 0 })
  })
}

export const PUT = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const body = await request.json()
    const { retirement_savings } = body

    validateRequired(body, ['retirement_savings'])

    await db
      .update(users)
      .set({ retirementSavings: retirement_savings })
      .where(eq(users.id, user.id))

    return jsonSuccess({ retirement_savings })
  })
}
