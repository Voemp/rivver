import { DBModel } from '@server/db/model'
import { MAX_FILE_SIZE } from '@server/modules/profile/service'
import { t } from 'elysia'

const { profileSelect } = DBModel

export const ProfileModel = {
  profileResponse: t.Object({
    userId: profileSelect.userId,
    avatarUrl: t.Nullable(t.String()),
    createdAt: profileSelect.createdAt,
    updatedAt: profileSelect.updatedAt,
  }),
  nicknameBody: t.Object({
    nickname: t.String({ minLength: 2, maxLength: 32 }),
  }),
  avatarBody: t.Object({
    file: t.File({
      maxSize: MAX_FILE_SIZE,
      type: ['image/jpeg', 'image/png', 'image/webp'],
      error: '头像文件过大或不支持的图片格式',
    }),
  }, { error: '缺少头像文件' }),
  avatarQuery: t.Object({
    v: t.Optional(t.Number({ error: '头像版本参数错误' })),
  }),
  avatarResponse: profileSelect.avatarBytes,
} as const
