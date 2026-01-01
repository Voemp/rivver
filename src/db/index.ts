import { DrizzlePostgresDB } from '../types/env'

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
