import { articleRepo } from '@server/repos/articleRepo'
import { AppError } from '@server/utils/error'

const SUMMARY_MAX_SOURCE_CHARS = 12000
const SUMMARY_REQUEST_TIMEOUT_MS = 30000

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string, text?: string }>
    }
  }>
}

const inflightSummaryTasks = new Map<number, Promise<string>>()

function stripHtml(input: string) {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, '\'')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMessageContent(payload: ChatCompletionResponse) {
  const content = payload.choices?.[0]?.message?.content

  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map(part => part.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n')
      .trim()
  }

  return ''
}

function pickSummarySource(article: Awaited<ReturnType<typeof articleRepo.findSummarySourceById>>) {
  if (!article) return null

  for (const candidate of [article.content, article.contentSnippet, article.summary]) {
    const plainText = stripHtml(candidate ?? '')
    if (plainText.length > 0) {
      return plainText.slice(0, SUMMARY_MAX_SOURCE_CHARS)
    }
  }

  return null
}

async function requestAiSummary(source: string) {
  const apiKey = process.env.AI_SUMMARY_API_KEY?.trim()
  const model = process.env.AI_SUMMARY_MODEL?.trim()
  const baseUrl = process.env.AI_SUMMARY_BASE_URL?.trim() || 'https://api.openai.com/v1'

  if (!apiKey || !model) {
    throw new AppError(503, 'AI 总结服务未配置', 'AI_SUMMARY_NOT_CONFIGURED')
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You summarize articles. Respond in Chinese as the source text. Return 3 to 5 concise markdown bullet points only.',
        },
        {
          role: 'user',
          content: `Summarize the following article content into concise bullet points:\n\n${source}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(SUMMARY_REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new AppError(502, detail || 'AI 总结生成失败', 'AI_SUMMARY_REQUEST_FAILED')
  }

  const payload = await response.json() as ChatCompletionResponse
  const aiSummary = extractMessageContent(payload)

  if (!aiSummary) {
    throw new AppError(502, 'AI 总结返回为空', 'AI_SUMMARY_EMPTY')
  }

  return aiSummary
}

async function generateAndPersistAiSummary(articleId: number) {
  const article = await articleRepo.findSummarySourceById(articleId)
  if (!article) {
    throw new AppError(404, '文章不存在', 'ARTICLE_NOT_FOUND')
  }

  const existed = article.aiSummary?.trim()
  if (existed) {
    return existed
  }

  const source = pickSummarySource(article)
  if (!source) {
    throw new AppError(422, '文章缺少可总结的正文内容', 'ARTICLE_SUMMARY_SOURCE_EMPTY')
  }

  const aiSummary = await requestAiSummary(source)
  const [updated] = await articleRepo.updateAiSummary(articleId, aiSummary)

  return updated?.aiSummary?.trim() || aiSummary
}

export async function ensureArticleAiSummary(articleId: number) {
  const existing = await articleRepo.findAiSummaryById(articleId)
  if (!existing) {
    throw new AppError(404, '文章不存在', 'ARTICLE_NOT_FOUND')
  }

  const aiSummary = existing.aiSummary?.trim()
  if (aiSummary) {
    return aiSummary
  }

  const inflight = inflightSummaryTasks.get(articleId)
  if (inflight) {
    return inflight
  }

  const task = generateAndPersistAiSummary(articleId)
    .finally(() => {
      inflightSummaryTasks.delete(articleId)
    })

  inflightSummaryTasks.set(articleId, task)

  return task
}
