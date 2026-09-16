import { createEnv } from '@t3-oss/env-core'
import * as z from 'zod'

export const env = createEnv({
  server: {
    // PostgreSQL 连接串
    DATABASE_URL: z.string().min(1),
    // 服务监听端口
    PORT: z.coerce.number().default(3000),
    // 逗号分隔的额外受信跨域来源
    TRUSTED_ORIGINS: z.string().default(''),
    // AI 总结为可选功能，未配置时相关接口返回 503，不阻断启动
    AI_SUMMARY_API_KEY: z.string().optional(),
    AI_SUMMARY_MODEL: z.string().optional(),
    AI_SUMMARY_BASE_URL: z.string().default('https://api.openai.com/v1'),
  },
  shared: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: process.env,
  // 空串（如 `PORT=`）视为未设置，让默认值生效、数字字段不被空串打断
  emptyStringAsUndefined: true,
  onValidationError: (issues) => {
    throw new Error(
      `环境变量校验失败：\n${issues
        .map((issue) => `  - ${issue.path?.map(String).join('.') || '(root)'}: ${issue.message}`)
        .join('\n')}`,
    )
  },
})

export type ServerEnv = typeof env
