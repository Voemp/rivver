import { db } from '@server/db'
import { type InsertUser, type SelectUser, user } from '@server/db/schema'

export default {
  create: async (newUser: InsertUser): Promise<SelectUser> => {
    const [row] = await db
      .insert(user)
      .values(newUser)
      .returning()
    return row
  },
  findByUsername: async (username: string): Promise<SelectUser | undefined> => {
    return db.query.user.findFirst({
      where: { username: username },
    })
  },
} as const
