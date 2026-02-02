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
    logger.error({ err: error }, 'API error')

    // Handle specific error types
    if (error.message === 'Unauthorized') {
      return jsonError('Unauthorized', 401)
    }

    if (error.message.startsWith('Missing required fields')) {
      return jsonError(error.message, 400)
    }

    if (error.message.includes('not found')) {
      return jsonError(error.message, 404)
    }

    if (error.message.includes('already exists')) {
      return jsonError(error.message, 409)
    }

    // Default error response
    return jsonError(error.message || 'Internal server error', 500)
  }
}

export const toCamelCase = (obj) => {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

export const toSnakeCase = (obj) => {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    result[snakeKey] = value
  }
  return result
}
