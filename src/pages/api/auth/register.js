import { registerUser, generateAccessToken, createRefreshToken } from '@/lib/auth.js'
import { handleApiRequest, jsonSuccess, jsonError, validateRequired } from '@/lib/api-utils.js'

export const POST = async ({ request }) => {
  return handleApiRequest(async () => {
    const body = await request.json()
    const { username, password } = body

    validateRequired(body, ['username', 'password'])

    if (password.length < 6) {
      return jsonError('Password must be at least 6 characters', 400)
    }

    const user = await registerUser(username, password)
    const accessToken = generateAccessToken(user.id)
    const refreshToken = await createRefreshToken(user.id)

    return jsonSuccess(
      {
        user: { id: user.id, username: user.username },
        accessToken: accessToken.token,
        refreshToken: refreshToken.token,
        expiresIn: accessToken.expiresIn,
      },
      201
    )
  })
}
