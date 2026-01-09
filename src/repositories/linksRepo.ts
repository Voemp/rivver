import { InsertLink, links, SelectLink } from '../db/schema'
import { DrizzleDB } from '../index'

export default (db = DrizzleDB.db) => ({
  findByUrl: async (url: string): Promise<SelectLink | undefined> => {
    return db.query.links.findFirst({
      where: { url: url },
    })
  },
  create: async (link: InsertLink): Promise<SelectLink> => {
    const [row] = await db
      .insert(links)
      .values(link)
      .returning()
    return row
  },
  list: async () => {
    return db.query.links.findMany()
  },
})
