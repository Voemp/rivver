import { InsertUser, SelectUser, users } from '../db/schema'
import { DrizzleDB } from '../index'

export const usersRepo = (db = DrizzleDB.db) => ({
  findByUsername: async (username: string): Promise<SelectUser | undefined> => {
    return db.query.users.findFirst({
      where: { username: username },
    })
  },
  create: async (user: InsertUser): Promise<SelectUser> => {
    const [row] = await db
      .insert(users)
      .values(user)
      .returning()
    return row
  },
})
