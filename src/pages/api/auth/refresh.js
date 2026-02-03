import { validateAndRotateRefreshToken, generateAccessToken, getUserById } from '@/lib/auth.js'
import { handleApiRequest, jsonSuccess, jsonError, validateRequired } from '@/lib/api-utils.js'

export const POST = async ({ request }) => {
  return handleApiRequest(async () => {
    const body = await request.json()
    const { refreshToken } = body

    validateRequired(body, ['refreshToken'])

    // Validate and rotate the refresh token (single-use)
    const result = await validateAndRotateRefreshToken(refreshToken)
    if (!result) {
      return jsonError('Invalid or expired refresh token', 401)
    }

    // Check user still exists
    const user = await getUserById(result.userId)
    if (!user) {
      return jsonError('User not found', 401)
    }

    // Generate new access token
    const accessToken = generateAccessToken(result.userId)

    return jsonSuccess({
      accessToken: accessToken.token,
      refreshToken: result.newRefreshToken, // New rotated token
      expiresIn: accessToken.expiresIn,
    })
  })
}
