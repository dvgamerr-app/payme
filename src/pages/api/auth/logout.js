import { revokeRefreshToken } from '@/lib/auth.js'
import { handleApiRequest } from '@/lib/api-utils.js'

export const POST = async ({ request }) => {
  return handleApiRequest(async () => {
    // Try to revoke the refresh token if provided
    try {
      const body = await request.json()
      if (body.refreshToken) {
        await revokeRefreshToken(body.refreshToken)
      }
    } catch {
      // Ignore errors - client may not send token
    }

    // Client-side also handles token removal from localStorage
    return new Response(null, { status: 204 })
  })
}
