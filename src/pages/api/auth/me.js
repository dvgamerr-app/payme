import { getUserFromSession } from '@/lib/auth.js'
import { handleApiRequest, jsonSuccess, jsonError } from '@/lib/api-utils.js'

export const GET = async ({ cookies }) => {
  return handleApiRequest(async () => {
    const sessionId = cookies.get('session_id')?.value
    const user = await getUserFromSession(sessionId)

    if (!user) {
      return jsonError('Not authenticated', 401)
    }

    return jsonSuccess({ id: user.id, username: user.username })
  })
}
