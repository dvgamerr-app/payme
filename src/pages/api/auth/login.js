import logger from '@/lib/logger.js'
import { loginUser, createSession } from '@/lib/auth.js'
import {
  handleApiRequest,
  jsonSuccess,
  jsonError,
  validateRequired,
  setSessionCookie,
} from '@/lib/api-utils.js'

export const POST = async ({ request, cookies }) => {
  return handleApiRequest(async () => {
    const body = await request.json()
    const { username, password } = body

    validateRequired(body, ['username', 'password'])

    try {
      const user = await loginUser(username, password)
      const { sessionId, expiresAt } = await createSession(user.id)

      setSessionCookie(cookies, sessionId, expiresAt)

      return jsonSuccess({ id: user.id, username: user.username })
    } catch (error) {
      logger.warn({ err: error, username }, 'Login failed')
      return jsonError('Invalid credentials', 401)
    }
  })
}
