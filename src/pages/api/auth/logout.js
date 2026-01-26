import { deleteSession } from '@/lib/auth.js'
import { handleApiRequest, jsonSuccess } from '@/lib/api-utils.js'

export const POST = async ({ cookies }) => {
  return handleApiRequest(async () => {
    const sessionId = cookies.get('session_id')?.value

    if (sessionId) {
      await deleteSession(sessionId)
    }

    cookies.delete('session_id', { path: '/' })

    return new Response(null, { status: 204 })
  })
}
