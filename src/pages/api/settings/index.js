import { db, schema, nowSql } from '@/lib/db.js'
import { eq } from 'drizzle-orm'
import { handleApiRequest, jsonSuccess, jsonError, validateRequired } from '@/lib/api-utils.js'

export const GET = async ({ locals }) => {
  return handleApiRequest(async () => {
    const userId = locals.user?.id
    if (!userId) {
      return jsonError('Unauthorized', 401)
    }

    let settings = await db.query.userSettings.findFirst({
      where: eq(schema.userSettings.userId, userId),
    })

    if (!settings) {
      const [newSettings] = await db
        .insert(schema.userSettings)
        .values({
          userId,
          baseCurrency: 'THB',
          currencySymbol: '฿',
        })
        .returning()
      settings = newSettings
    }

    return jsonSuccess({
      baseCurrency: settings.baseCurrency,
      currencySymbol: settings.currencySymbol,
    })
  })
}

export const PUT = async ({ request, locals }) => {
  return handleApiRequest(async () => {
    const userId = locals.user?.id
    if (!userId) {
      return jsonError('Unauthorized', 401)
    }

    const body = await request.json()
    const { baseCurrency, currencySymbol } = body

    validateRequired(body, ['baseCurrency', 'currencySymbol'])

    const existing = await db.query.userSettings.findFirst({
      where: eq(schema.userSettings.userId, userId),
    })

    let settings
    if (existing) {
      ;[settings] = await db
        .update(schema.userSettings)
        .set({
          baseCurrency,
          currencySymbol,
          updatedAt: nowSql,
        })
        .where(eq(schema.userSettings.userId, userId))
        .returning()
    } else {
      ;[settings] = await db
        .insert(schema.userSettings)
        .values({
          userId,
          baseCurrency,
          currencySymbol,
        })
        .returning()
    }

    return jsonSuccess({
      baseCurrency: settings.baseCurrency,
      currencySymbol: settings.currencySymbol,
    })
  })
}
