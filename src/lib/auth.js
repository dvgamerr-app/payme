import bcrypt from 'bcrypt'
import { and, eq, gt, lte } from 'drizzle-orm'
import logger from './logger.js'
import { db, nowSql, schema } from './db.js'

const { sessions, users, budgetCategories } = schema

const SALT_ROUNDS = 10
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

const generateSessionId = () => {
  return crypto.randomUUID()
}

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

export const createSession = async (userId) => {
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  })

  return { sessionId, expiresAt }
}

export const getUserFromSession = async (sessionId) => {
  if (!sessionId) return null

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      savings: users.savings,
      retirementSavings: users.retirementSavings,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, nowSql)))
    .limit(1)

  return rows[0] ?? null
}

export const deleteSession = async (sessionId) => {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export const cleanupExpiredSessions = async () => {
  // drizzle-orm sqlite ไม่รองรับ .returning()
  const result = await db.delete(sessions).where(lte(sessions.expiresAt, nowSql))
  // result.changes (sqlite), result.rowCount (pg)
  const count = result?.changes ?? result?.rowCount ?? 0
  if (count > 0) {
    logger.info({ count }, 'Cleaned up expired sessions')
  }
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

// Run cleanup every 6 hours
setInterval(
  () => {
    cleanupExpiredSessions().catch((error) =>
      logger.error({ err: error }, 'Session cleanup failed')
    )
  },
  6 * 60 * 60 * 1000
)
