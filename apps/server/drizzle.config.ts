import { defineConfig, type Config } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('缺少 DATABASE_URL 环境变量')
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  schemaFilter: ['public'],
  // drizzle-kit rc.4 运行时会读取顶层 casing（push/pull 均消费 config.casing），但类型声明缺失
  casing: 'snake_case',
} as Config & { casing: 'snake_case' })
