import 'dotenv/config'
import Database from 'better-sqlite3'
import postgres from 'postgres'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import { join } from 'path'
import * as sqliteSchema from './schema/sqlite.js'
import * as postgresSchema from './schema/postgres.js'

const DIALECT = (process.env.DB_DIALECT || 'sqlite').toLowerCase()
const isPostgres = DIALECT === 'postgres' || DIALECT === 'postgresql'

let db
let schema

if (isPostgres) {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required when DB_DIALECT=postgres')
  }
  const client = postgres(connectionString, { max: 10 })
  db = drizzlePostgres(client, { schema: postgresSchema })
  schema = postgresSchema
} else {
  const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'payme.db')
  const sqlite = new Database(dbPath)
  sqlite.pragma('foreign_keys = ON')
  db = drizzleSqlite(sqlite, { schema: sqliteSchema })
  schema = sqliteSchema
}

export { db, schema }
export const dbDialect = isPostgres ? 'postgres' : 'sqlite'
export const nowSql = isPostgres ? sql`now()` : sql`datetime('now')`
export { sql }
