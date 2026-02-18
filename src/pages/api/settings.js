import { db, schema, nowSql } from '@/lib/db.js'
import { count, eq, inArray } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, validateRequired } from '@/lib/api-utils.js'

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

    // Check if user has any items (spending records) - used to lock currency change
    const userMonths = await db
      .select({ id: schema.months.id })
      .from(schema.months)
      .where(eq(schema.months.userId, user.id))
    const monthIds = userMonths.map((m) => m.id)
    let hasItems = false
    if (monthIds.length > 0) {
      const itemCount = await db
        .select({ value: count() })
        .from(schema.items)
        .where(inArray(schema.items.monthId, monthIds))
      hasItems = Number(itemCount[0]?.value ?? 0) > 0
    }

    return jsonSuccess({
      baseCurrency: settings.baseCurrency,
      currencySymbol: settings.currencySymbol,
      payday: settings.payday,
      currencyLocked: hasItems,
    })
  })
}

export const PUT = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const body = await request.json()
    const { baseCurrency, currencySymbol, payday } = body

    validateRequired(body, ['baseCurrency', 'currencySymbol', 'payday'])

    // Check if currency change is allowed (user must have no items)
    const existing = await db.query.userSettings.findFirst({
      where: eq(schema.userSettings.userId, user.id),
    })

    if (
      existing &&
      (existing.baseCurrency !== baseCurrency || existing.currencySymbol !== currencySymbol)
    ) {
      const userMonths = await db
        .select({ id: schema.months.id })
        .from(schema.months)
        .where(eq(schema.months.userId, user.id))
      const monthIds = userMonths.map((m) => m.id)
      if (monthIds.length > 0) {
        const itemCount = await db
          .select({ value: count() })
          .from(schema.items)
          .where(inArray(schema.items.monthId, monthIds))
        if (Number(itemCount[0]?.value ?? 0) > 0) {
          return jsonError(
            'Currency cannot be changed: you already have spending items recorded',
            409
          )
        }
      }
    }

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
