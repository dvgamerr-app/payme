import { eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, validateRequired } from '@/lib/api-utils.js'

const { users } = schema

export const GET = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const rows = await db
      .select({ savings: users.savings })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    return jsonSuccess({ savings: rows[0]?.savings || 0 })
  })
}

export const PUT = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const body = await request.json()
    const { savings } = body

    validateRequired(body, ['savings'])

    await db.update(users).set({ savings }).where(eq(users.id, user.id))

    return jsonSuccess({ savings })
  })
}
