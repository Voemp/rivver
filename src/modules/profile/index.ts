import {
  bufferToHex, ensureProfile, MAX_OUTPUT_BYTES, TARGET_SIZE, toProfileResponse,
} from '@server/modules/profile/service'
import { profileRepo } from '@server/repos/profileRepo'
import { ApiResponseModel } from '@server/types/response'
import { AppError } from '@server/utils/error'
import { Elysia, status } from 'elysia'
import sharp from 'sharp'
import { betterAuth } from '../auth/service'
import { ProfileModel } from './model'

export const profile = new Elysia({
  prefix: '/profile',
  detail: {
    tags: ['Profile'],
    security: [{ cookieAuth: [] }],
  },
})
  .use(betterAuth)
  .get('', async ({ user }) => {
    const profile = await ensureProfile(user.id)
    return status(200, toProfileResponse(profile))
  }, {
    auth: true,
    response: {
      200: ProfileModel.profileResponse,
    },
  })
  .patch('/nickname', async ({ user, body: { nickname } }) => {
    const trimmed = nickname.trim()
    const existing = await profileRepo.existsNickname(trimmed, user.id)
    if (existing) throw new AppError(409, '昵称已被占用', 'NICKNAME_CONFLICT')

    await ensureProfile(user.id)

    const profile = await profileRepo.updateNickname(user.id, trimmed)

    return status(200, toProfileResponse(profile))
  }, {
    auth: true,
    body: ProfileModel.nicknameBody,
    response: {
      200: ProfileModel.profileResponse,
      409: ApiResponseModel.error('昵称已被占用', 'NICKNAME_CONFLICT'),
    },
  })
  .put('/avatar', async ({ user, body }) => {
    const inputBuffer = Buffer.from(await body.file.arrayBuffer())

    let output = await sharp(inputBuffer)
      .rotate()
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover' })
      .webp({ quality: 75 })
      .toBuffer()

    if (output.byteLength > MAX_OUTPUT_BYTES) {
      output = await sharp(inputBuffer)
        .rotate()
        .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover' })
        .webp({ quality: 65 })
        .toBuffer()
    }

    const hash = bufferToHex(output)

    await ensureProfile(user.id)

    const profile = await profileRepo.updateAvatar(user.id, output, hash, 'image/webp')

    return status(200, toProfileResponse(profile))
  }, {
    auth: true,
    body: ProfileModel.avatarBody,
    response: {
      200: ProfileModel.profileResponse,
    },
  })
  .get('/avatar', async ({ user, set, request, query }) => {
    const profile = await profileRepo.findByUserId(user.id)
    if (!profile?.avatarBytes) throw new AppError(404, '头像不存在', 'AVATAR_NOT_FOUND')

    const version = query?.v
    const isCurrentVersion = version === profile.avatarVersion
    const etag = profile.avatarHash ? `"${profile.avatarVersion}-${profile.avatarHash}"` : undefined
    if (etag && request.headers.get('if-none-match') === etag) {
      set.status = 304
      return null
    }

    set.headers['content-type'] = profile.avatarMime
    set.headers['cache-control'] = isCurrentVersion
      ? 'private, max-age=31536000, immutable'
      : 'private, max-age=0, must-revalidate'
    if (etag) set.headers.etag = etag

    return profile.avatarBytes
  }, {
    auth: true,
    query: ProfileModel.avatarQuery,
    response: {
      200: ProfileModel.avatarResponse,
      404: ApiResponseModel.error('头像不存在', 'AVATAR_NOT_FOUND'),
    },
  })
