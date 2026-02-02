import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess } from '@/lib/api-utils.js'
import { getStatsData } from '@/lib/data/stats.js'

export const GET = async ({ request }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(request)
    const stats = await getStatsData(user)
    return jsonSuccess(stats)
  })
}
