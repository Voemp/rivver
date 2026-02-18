import { db } from '@/db'
import { article } from '@/db/schema'
import { pipeline } from '@xenova/transformers'
import { and, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'

// 轻量中文模型（35MB）
const generator = await pipeline('feature-extraction', 'TaylorAI/gte-tiny')

async function processBatch(articleIds: number[]) {
  const articles = await db
    .select({
      id: article.id,
      title: article.title,
      contentSnippet: article.contentSnippet,
    })
    .from(article)
    .where(inArray(article.id, articleIds))

  for (const a of articles) {
    if (!a.contentSnippet) continue

    // 构造输入：标题 + 摘要前200字
    const text = `${a.title} ${a.contentSnippet.slice(0, 200)}`

    // 生成 embedding
    const output = await generator(text, { pooling: 'mean', normalize: true })
    const embedding = Array.from(output.data)

    // 更新数据库
    await db.update(article)
      .set({ embedding })
      .where(eq(article.id, a.id))
  }
}

export async function generateEmbedding() {
  const pending = await db
    .select({
      id: article.id,
    })
    .from(article)
    .where(
      and(
        isNull(article.embedding),
        isNotNull(article.contentSnippet),
      ),
    )
    .orderBy(desc(article.createdAt))
    .limit(100)

  if (pending.length > 0) {
    console.log(`Processing ${pending.length} articles for embedding`)
    await processBatch(pending.map(p => p.id))
  }
}