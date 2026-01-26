import { registerUser, createSession } from '@/lib/auth.js'
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

    if (password.length < 6) {
      return jsonError('Password must be at least 6 characters', 400)
    }

    const user = await registerUser(username, password)
    const { sessionId, expiresAt } = await createSession(user.id)

    setSessionCookie(cookies, sessionId, expiresAt)

    return jsonSuccess({ id: user.id, username: user.username }, 201)
  })
}
