import { verifyToken, getUserById } from './auth.js'
import { handleApiRequest, jsonError } from './api-utils.js'

export const requireAuth = async (request) => {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.slice(7)
  const decoded = verifyToken(token, 'access')

  if (!decoded) {
    throw new Error('Unauthorized')
  }

  const user = await getUserById(decoded.userId)
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export const authResponse = (_error) => {
  return jsonError('Unauthorized', 401)
}

export const withAuth = (handler) => {
  return async (context) => {
    return handleApiRequest(async () => {
      const user = await requireAuth(context.request)
      return handler({ ...context, user })
    })
  }
}
