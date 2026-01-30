import { requireAuth } from '@/lib/middleware.js'
import { handleApiRequest, jsonSuccess } from '@/lib/api-utils.js'
import { getStatsData } from '@/lib/data/stats.js'

export const GET = async ({ cookies }) => {
  return handleApiRequest(async () => {
    const user = await requireAuth(cookies)
    const stats = await getStatsData(user)
    return jsonSuccess(stats)
  })
}
