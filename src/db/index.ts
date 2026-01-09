import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { relations } from './relations'

type DrizzlePostgresDB = PostgresJsDatabase<Record<string, never>, typeof relations>

class DBWrapper {
  db: DrizzlePostgresDB

  constructor() {
    this.db = {} as DrizzlePostgresDB
  }

  set(db: DrizzlePostgresDB) {
    this.db = db
  }
}

export default DBWrapper
