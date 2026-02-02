import { db, schema, nowSql } from '@/lib/db.js'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, validateRequired } from '@/lib/api-utils.js'

export const GET = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)

    let settings = await db.query.userSettings.findFirst({
      where: eq(schema.userSettings.userId, user.id),
    })

    if (!settings) {
      const [newSettings] = await db
        .insert(schema.userSettings)
        .values({
          userId: user.id,
          baseCurrency: 'THB',
          currencySymbol: '฿',
          payday: 'end',
        })
        .returning()
      settings = newSettings
    }

    return jsonSuccess({
      baseCurrency: settings.baseCurrency,
      currencySymbol: settings.currencySymbol,
      payday: settings.payday,
    })
  })
}

export const PUT = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const body = await request.json()
    const { baseCurrency, currencySymbol, payday } = body

    validateRequired(body, ['baseCurrency', 'currencySymbol', 'payday'])

    const existing = await db.query.userSettings.findFirst({
      where: eq(schema.userSettings.userId, user.id),
    })

    let settings
    if (existing) {
      ;[settings] = await db
        .update(schema.userSettings)
        .set({
          baseCurrency,
          currencySymbol,
          payday,
          updatedAt: nowSql,
        })
        .where(eq(schema.userSettings.userId, user.id))
        .returning()
    } else {
      ;[settings] = await db
        .insert(schema.userSettings)
        .values({
          userId: user.id,
          baseCurrency,
          currencySymbol,
          payday,
        })
        .returning()
    }

    return jsonSuccess({
      baseCurrency: settings.baseCurrency,
      currencySymbol: settings.currencySymbol,
      payday: settings.payday,
    })
  })
}
