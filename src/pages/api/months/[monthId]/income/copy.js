import { asc, desc, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, parseIntParam } from '@/lib/api-utils.js'
import { getMonthByIdForUser } from '@/lib/db-helpers.js'

const { incomeEntries, months } = schema

export const POST = async ({ params, cookies }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(cookies)
    const monthId = parseIntParam(params.monthId, 'month ID')

    const currentMonth = await getMonthByIdForUser(monthId, user.id)

    // หาเดือนก่อนหน้า
    const prevMonthRows = await db
      .select({
        id: months.id,
        year: months.year,
        month: months.month,
      })
      .from(months)
      .where(eq(months.userId, user.id))
      .orderBy(desc(months.year), desc(months.month))
      .limit(10)

    if (prevMonthRows.length === 0) {
      throw new Error('No previous month found')
    }

    // หาเดือนก่อนหน้าจาก current month
    const currentYear = currentMonth.year
    const currentMonthNum = currentMonth.month
    let previousMonthId = null

    for (const m of prevMonthRows) {
      if (m.year < currentYear || (m.year === currentYear && m.month < currentMonthNum)) {
        previousMonthId = m.id
        break
      }
    }

    if (!previousMonthId) {
      throw new Error('No previous month found')
    }

    // ดึง income entries จากเดือนก่อนหน้า
    const previousIncome = await db
      .select({
        label: incomeEntries.label,
        amount: incomeEntries.amount,
        displayOrder: incomeEntries.displayOrder,
      })
      .from(incomeEntries)
      .where(eq(incomeEntries.monthId, previousMonthId))
      .orderBy(asc(incomeEntries.displayOrder))

    if (previousIncome.length === 0) {
      throw new Error('No income entries found in previous month')
    }

    // คัดลอก income entries ไปยังเดือนปัจจุบัน
    const newEntries = previousIncome.map((entry) => ({
      monthId,
      label: entry.label,
      amount: entry.amount,
      displayOrder: entry.displayOrder,
    }))

    await db.insert(incomeEntries).values(newEntries)

    // ดึง entries ใหม่ที่เพิ่งสร้าง
    const createdEntries = await db
      .select({
        id: incomeEntries.id,
        month_id: incomeEntries.monthId,
        label: incomeEntries.label,
        amount: incomeEntries.amount,
      })
      .from(incomeEntries)
      .where(eq(incomeEntries.monthId, monthId))
      .orderBy(asc(incomeEntries.displayOrder))

    return jsonSuccess({
      message: 'Income entries copied successfully',
      count: newEntries.length,
      entries: createdEntries,
    })
  })
}
