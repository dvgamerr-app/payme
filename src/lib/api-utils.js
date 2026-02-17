import logger from './logger.js'

const jsonHeaders = { 'Content-Type': 'application/json' }

export const jsonSuccess = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  })
}

export const jsonError = (message, status = 500) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders,
  })
}

// Map database errors to user-friendly messages
const mapDatabaseError = (error) => {
  // PostgreSQL error codes
  if (error?.code === '23505' || error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return { message: 'This record already exists', status: 409 }
  }
  if (error?.code === '23503') {
    return { message: 'Cannot delete: related records exist', status: 409 }
  }
  if (error?.code === '23502') {
    return { message: 'Required field is missing', status: 400 }
  }

  // SQLite errors
  if (error?.message?.includes('UNIQUE constraint failed')) {
    return { message: 'This record already exists', status: 409 }
  }
  if (error?.message?.includes('FOREIGN KEY constraint failed')) {
    return { message: 'Cannot delete: related records exist', status: 409 }
  }
  if (error?.message?.includes('NOT NULL constraint failed')) {
    return { message: 'Required field is missing', status: 400 }
  }

  // Drizzle/Query errors - hide SQL details
  if (
    error?.message?.includes('Failed query:') ||
    error?.message?.includes('insert into') ||
    error?.message?.includes('select')
  ) {
    return { message: 'Database operation failed', status: 500 }
  }

  return null
}

// Sanitize error for client response - NEVER expose sensitive data
const sanitizeError = (error) => {
  const errorMessage = typeof error?.message === 'string' ? error.message : ''

  // Known safe errors
  if (errorMessage === 'Unauthorized') {
    return { message: 'Unauthorized', status: 401 }
  }
  if (errorMessage.startsWith('Missing required fields')) {
    return { message: errorMessage, status: 400 }
  }
  if (errorMessage.includes('not found')) {
    return { message: errorMessage, status: 404 }
  }
  if (errorMessage.includes('already exists')) {
    return { message: errorMessage, status: 409 }
  }
  if (errorMessage.startsWith('Invalid ')) {
    return { message: errorMessage, status: 400 }
  }

  // Check for database errors
  const dbError = mapDatabaseError(error)
  if (dbError) return dbError

  // Default: hide all details, return generic message
  return { message: 'An error occurred. Please try again.', status: 500 }
}

export const validateRequired = (body, requiredFields) => {
  const missing = []

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field)
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
}

export const parseIntParam = (param, paramName = 'parameter') => {
  const parsed = parseInt(param)
  if (isNaN(parsed)) {
    throw new Error(`Invalid ${paramName}: must be a number`)
  }
  return parsed
}

export const verifyOwnership = (resource, userId, resourceName = 'Resource') => {
  if (!resource) {
    throw new Error(`${resourceName} not found`)
  }
  if (resource.user_id !== userId) {
    throw new Error(`${resourceName} not found`)
  }
}

export const handleApiRequest = async (handler) => {
  try {
    return await handler()
  } catch (error) {
    const errorMessage = typeof error?.message === 'string' ? error.message : 'Unknown error'
    const stack = typeof error?.stack === 'string' ? error.stack : undefined

    // Log full error details on server (for debugging)
    logger.error(
      {
        message: errorMessage,
        code: error?.code,
        name: error?.name,
        // Never log stack in production, but useful for dev
        ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
      },
      'API error'
    )

    // Return sanitized error to client
    const { message, status } = sanitizeError(error)
    return jsonError(message, status)
  }
}

export const toCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {}
  }

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

export const toSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {}
  }

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    result[snakeKey] = value
  }
  return result
}
