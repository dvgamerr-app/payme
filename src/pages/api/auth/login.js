import logger from '@/lib/logger.js'
import { loginUser, generateAccessToken, createRefreshToken } from '@/lib/auth.js'
import { handleApiRequest, jsonSuccess, jsonError, validateRequired } from '@/lib/api-utils.js'

export const POST = async ({ request }) => {
  return handleApiRequest(async () => {
    const body = await request.json()
    const { username, password } = body

    validateRequired(body, ['username', 'password'])

    try {
      const user = await loginUser(username, password)
      const accessToken = generateAccessToken(user.id)
      const refreshToken = await createRefreshToken(user.id)

      return jsonSuccess({
        user: { id: user.id, username: user.username },
        accessToken: accessToken.token,
        refreshToken: refreshToken.token,
        expiresIn: accessToken.expiresIn,
      })
    } catch (error) {
      logger.warn({ err: error, username }, 'Login failed')
      return jsonError('Invalid credentials', 401)
    }
  })
}
