import { handleApiRequest } from '@/lib/api-utils.js'

export const POST = async () => {
  return handleApiRequest(async () => {
    // Client-side handles token removal from localStorage
    // Server just acknowledges the logout
    return new Response(null, { status: 204 })
  })
}
