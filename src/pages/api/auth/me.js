import { verifyToken, getUserById } from '@/lib/auth.js'
import { handleApiRequest, jsonSuccess, jsonError } from '@/lib/api-utils.js'

export const GET = async ({ request }) => {
  return handleApiRequest(async () => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError('Not authenticated', 401)
    }

    const token = authHeader.slice(7)
    const decoded = verifyToken(token, 'access')

    if (!decoded) {
      return jsonError('Invalid or expired token', 401)
    }

    const user = await getUserById(decoded.userId)
    if (!user) {
      return jsonError('User not found', 401)
    }

    return jsonSuccess({ id: user.id, username: user.username, role: user.role })
  })
}
