import { db } from '@/db'

export const interestRepo = {
  findByUser: async (userId: string) => {
    return db.query.userInterest.findFirst({
      where: { userId },
    })
  },
}