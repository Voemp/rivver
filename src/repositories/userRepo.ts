import { db } from '../database'
import { InsertUser, SelectUser, user } from '../database/schema'

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
}
