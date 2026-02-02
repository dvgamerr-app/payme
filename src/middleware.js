import { defineMiddleware } from 'astro:middleware'
import logger from './lib/logger.js'
import { verifyToken, getUserById } from './lib/auth.js'

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals } = context

  // Try to get user from Bearer token
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const decoded = verifyToken(token, 'access')
      if (decoded) {
        const user = await getUserById(decoded.userId)
        if (user) {
          locals.user = user
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Middleware: Error verifying token')
    }
  }

  return next()
})
