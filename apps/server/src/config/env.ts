import { Type, type Static } from '@sinclair/typebox'
import { AssertError, Value } from '@sinclair/typebox/value'

const serverEnvSchema = Type.Object({
  // PostgreSQL 连接串
  DATABASE_URL: Type.String({ minLength: 1 }),
  // 服务监听端口
  PORT: Type.Number({ default: 3000 }),
  // 逗号分隔的额外受信跨域来源
  TRUSTED_ORIGINS: Type.String({ default: '' }),
  NODE_ENV: Type.Union(
    [Type.Literal('development'), Type.Literal('production'), Type.Literal('test')],
    { default: 'development' },
  ),
  // AI 总结为可选功能，未配置时相关接口返回 503，不阻断启动
  AI_SUMMARY_API_KEY: Type.Optional(Type.String()),
  AI_SUMMARY_MODEL: Type.Optional(Type.String()),
  AI_SUMMARY_BASE_URL: Type.String({ default: 'https://api.openai.com/v1' }),
})

export type ServerEnv = Static<typeof serverEnvSchema>

// 去除首尾空白，空串视为未设置（交给 schema 默认值 / optional 处理）
function cleanRawEnv(raw: Record<string, string | undefined>) {
  const cleaned: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    const trimmed = value?.trim()
    if (trimmed) {
      cleaned[key] = trimmed
    }
  }
  return cleaned
}

function parseServerEnv(): ServerEnv {
  try {
    return Value.Parse(serverEnvSchema, cleanRawEnv(process.env))
  } catch (error) {
    if (!(error instanceof AssertError)) {
      throw error
    }
    const seen = new Set<string>()
    const lines: string[] = []
    for (const item of error.Errors()) {
      if (seen.has(item.path)) continue
      seen.add(item.path)
      lines.push(`  - ${item.path.slice(1) || '(root)'}: ${item.message}`)
    }
    throw new Error(`环境变量校验失败：\n${lines.join('\n')}`, { cause: error })
  }
}

export const env: ServerEnv = parseServerEnv()
