import { desc, eq, and } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, parseIntParam } from '@/lib/api-utils.js'

const { months } = schema

export const GET = async ({ request, url }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const userId = user.id

    const yearParam = url.searchParams.get('year')
    const monthParam = url.searchParams.get('month')

    // If no year/month provided, return all months for the user
    if (!yearParam || !monthParam) {
      const allMonths = await db
        .select()
        .from(months)
        .where(eq(months.userId, userId))
        .orderBy(desc(months.year), desc(months.month))
        .all()
      return jsonSuccess(allMonths)
    }

    const year = parseIntParam(yearParam, 'year')
    const month = parseIntParam(monthParam, 'month')

    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12')
    }

    // Try to find existing month
    const existingMonth = await db
      .select()
      .from(months)
      .where(and(eq(months.userId, userId), eq(months.year, year), eq(months.month, month)))
      .get()

    if (existingMonth) {
      return jsonSuccess(existingMonth)
    }

    // Create new month
    const newMonth = await db
      .insert(months)
      .values({
        userId,
        year,
        month,
        isClosed: 0,
      })
      .returning()
      .get()

    return jsonSuccess(newMonth, 201)
  })
}
