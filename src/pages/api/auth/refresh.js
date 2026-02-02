import { verifyToken, generateAccessToken, getUserById } from '@/lib/auth.js'
import { handleApiRequest, jsonSuccess, jsonError, validateRequired } from '@/lib/api-utils.js'

export const POST = async ({ request }) => {
  return handleApiRequest(async () => {
    const body = await request.json()
    const { refreshToken } = body

    validateRequired(body, ['refreshToken'])

    // Verify the refresh token
    const decoded = verifyToken(refreshToken, 'refresh')
    if (!decoded) {
      return jsonError('Invalid or expired refresh token', 401)
    }

    // Check user still exists
    const user = await getUserById(decoded.userId)
    if (!user) {
      return jsonError('User not found', 401)
    }

    // Generate new access token
    const accessToken = generateAccessToken(decoded.userId)

    return jsonSuccess({
      accessToken: accessToken.token,
      expiresIn: accessToken.expiresIn,
    })
  })
}
