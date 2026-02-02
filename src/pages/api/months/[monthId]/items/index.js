import { desc, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db.js'
import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, validateRequired, parseIntParam } from '@/lib/api-utils.js'
import { getMonthByIdForUser, getCategoryByIdForUser } from '@/lib/db-helpers.js'

const { budgetCategories, items } = schema

export const GET = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'month ID')

    await getMonthByIdForUser(monthId, user.id)

    const itemsRows = await db
      .select({
        id: items.id,
        month_id: items.monthId,
        category_id: items.categoryId,
        description: items.description,
        amount: items.amount,
        spent_on: items.spentOn,
        category_label: budgetCategories.label,
      })
      .from(items)
      .innerJoin(budgetCategories, eq(budgetCategories.id, items.categoryId))
      .where(eq(items.monthId, monthId))
      .orderBy(desc(items.spentOn), desc(items.id))

    return jsonSuccess(itemsRows)
  })
}

export const POST = async ({ params, request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const monthId = parseIntParam(params.monthId, 'month ID')
    const body = await request.json()
    const { category_id, description, amount, spent_on } = body

    validateRequired(body, ['description', 'amount', 'spent_on'])

    await getMonthByIdForUser(monthId, user.id)

    // ถ้าไม่ได้เลือก category ให้ใช้ "อื่นๆ" category เป็น default
    let finalCategoryId = category_id
    if (!category_id) {
      const defaultCategory = await db
        .select({ id: budgetCategories.id })
        .from(budgetCategories)
        .where(eq(budgetCategories.userId, user.id))
        .limit(1)

      if (defaultCategory.length > 0) {
        finalCategoryId = defaultCategory[0].id
      } else {
        throw new Error('No category available. Please create a category first.')
      }
    } else {
      await getCategoryByIdForUser(category_id, user.id)
    }

    const rows = await db
      .insert(items)
      .values({
        monthId,
        categoryId: finalCategoryId,
        description,
        amount,
        spentOn: spent_on,
      })
      .returning({ id: items.id })

    const item = {
      id: rows[0]?.id,
      month_id: monthId,
      category_id: finalCategoryId,
      description,
      amount,
      spent_on,
    }

    return jsonSuccess(item, 201)
  })
}
