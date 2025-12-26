import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  profiles: {
    user: r.one.users({
      from: r.profiles.userId,
      to: r.users.id
    }),
  },
  users: {
    profiles: r.many.profiles(),
  },
}))
