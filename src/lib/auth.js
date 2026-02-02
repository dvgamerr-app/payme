import bcrypt from 'bcrypt'
import { eq } from 'drizzle-orm'
import logger from './logger.js'
import { db, schema } from './db.js'

const { users, budgetCategories } = schema

const SALT_ROUNDS = 10
const ACCESS_TOKEN_DURATION = 15 * 60 * 1000 // 15 minutes
const REFRESH_TOKEN_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

// Simple token format: base64(userId:expiresAt:signature)
const SECRET_KEY = process.env.JWT_SECRET || 'payme-secret-key-change-in-production'

const generateSignature = (data) => {
  const encoder = new TextEncoder()
  const dataBytes = encoder.encode(data + SECRET_KEY)
  // Simple hash using crypto
  let hash = 0
  for (let i = 0; i < dataBytes.length; i++) {
    hash = ((hash << 5) - hash + dataBytes[i]) | 0
  }
  return Math.abs(hash).toString(36)
}

export const generateAccessToken = (userId) => {
  const expiresAt = Date.now() + ACCESS_TOKEN_DURATION
  const data = `${userId}:${expiresAt}:access`
  const signature = generateSignature(data)
  const token = Buffer.from(`${data}:${signature}`).toString('base64url')
  return { token, expiresAt, expiresIn: ACCESS_TOKEN_DURATION }
}

export const generateRefreshToken = (userId) => {
  const expiresAt = Date.now() + REFRESH_TOKEN_DURATION
  const data = `${userId}:${expiresAt}:refresh`
  const signature = generateSignature(data)
  const token = Buffer.from(`${data}:${signature}`).toString('base64url')
  return { token, expiresAt, expiresIn: REFRESH_TOKEN_DURATION }
}

export const verifyToken = (token, expectedType = 'access') => {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length !== 4) return null

    const [userId, expiresAt, type, signature] = parts

    // Check type
    if (type !== expectedType) return null

    // Check expiry
    if (Date.now() > parseInt(expiresAt)) return null

    // Verify signature
    const data = `${userId}:${expiresAt}:${type}`
    const expectedSignature = generateSignature(data)
    if (signature !== expectedSignature) return null

    return { userId: parseInt(userId), expiresAt: parseInt(expiresAt) }
  } catch {
    return null
  }
}

export const getUserById = async (userId) => {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      savings: users.savings,
      retirementSavings: users.retirementSavings,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return rows[0] ?? null
}

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

export const registerUser = async (username, password) => {
  const passwordHash = await hashPassword(password)

  try {
    const rows = await db
      .insert(users)
      .values({ username, passwordHash })
      .returning({ id: users.id, username: users.username })
    const user = rows[0]

    // สร้าง default category "อื่นๆ" ให้ผู้ใช้ใหม่
    if (user) {
      await db.insert(budgetCategories).values({
        userId: user.id,
        label: 'อื่นๆ',
        defaultAmount: 0,
      })
    }

    return user
  } catch (error) {
    if (
      error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      error?.code === '23505' ||
      error?.message?.includes('UNIQUE constraint failed')
    ) {
      throw new Error('Username already exists')
    }
    throw error
  }
}

export const loginUser = async (username, password) => {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)
  const user = rows[0]

  if (!user) {
    throw new Error('Invalid credentials')
  }

  const isValid = await verifyPassword(password, user.passwordHash)

  if (!isValid) {
    throw new Error('Invalid credentials')
  }

  return { id: user.id, username: user.username }
}
