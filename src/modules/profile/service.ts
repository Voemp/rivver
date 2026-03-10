import { SelectProfile } from '@server/db/schema'
import { profileRepo } from '@server/repos/profileRepo'
import { createHash } from 'crypto'

export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const TARGET_SIZE = 256
export const MAX_OUTPUT_BYTES = 30 * 1024

export const bufferToHex = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex')

export const ensureProfile = async (userId: string) => {
  let profile = await profileRepo.findByUserId(userId)

  if (!profile) {
    profile = await profileRepo.create({ userId })
  }

  return profile
}

export const toProfileResponse = (profile: SelectProfile) => {
  return {
    userId: profile.userId,
    avatarUrl: profile.avatarBytes ? `/profile/avatar?v=${profile.avatarVersion}` : null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}
