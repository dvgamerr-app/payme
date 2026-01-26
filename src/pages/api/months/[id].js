import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess, jsonError, parseIntParam } from '@/lib/api-utils.js'
import { getMonthSummary } from '@/lib/db-helpers.js'

export const GET = async ({ params, cookies }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(cookies)
    const monthId = parseIntParam(params.id, 'month ID')

    const summary = await getMonthSummary(monthId, user.id)

    if (!summary) {
      return jsonError('Month not found', 404)
    }

    return jsonSuccess(summary)
  })
}
