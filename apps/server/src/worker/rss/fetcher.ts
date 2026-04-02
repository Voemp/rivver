import type { ContentKind, InsertArticle, SelectFeed } from '@server/db/schema'
import { articleRepo } from '@server/repos/articleRepo'
import { feedRepo } from '@server/repos/feedRepo'
import pLimit from 'p-limit'
import Parser from 'rss-parser'

const parser = new Parser()
const IMG_SRC_PATTERN = /<img\b[^>]*?\bsrc=(['"]?)([^'" >]+)\1/i
const IMG_TAG_PATTERN = /<img\b[^>]*>/gi
const VIDEO_TAG_PATTERN = /<(video|iframe|embed)\b[^>]*>[\s\S]*?<\/\1>|<(video|iframe|embed)\b[^>]*\/?>/gi
const TEXT_BLOCK_TAG_PATTERN = /<(p|li|h[1-6]|blockquote|pre|td|th|figcaption|summary)\b[^>]*>/gi
const LIGHT_TEXT_TAG_PATTERN = /<(br|span|strong|em|b|i)\b[^>]*\/?>/gi
const COMMENT_PATTERN = /<!--[\s\S]*?-->/g
const SCRIPT_STYLE_PATTERN = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi
const WRAPPER_TAG_PATTERN = /<\/?(div|section|article|main|figure|figcaption|picture|p|span|a|br|hr)\b[^>]*>/gi
const SELF_CLOSING_MEDIA_PATTERN = /<(img|source)\b[^>]*\/?>/gi
const VIDEO_TEXT_MAX = 140
const IMAGE_TEXT_MAX = 80
const IMAGE_TEXT_PER_ASSET = 36
const VIDEO_TEXT_BLOCK_MAX = 2
const VIDEO_LIGHT_TAG_MAX = 4
const IMAGE_TEXT_BLOCK_MAX = 2
const IMAGE_LIGHT_TAG_BASE_MAX = 4
const VIDEO_TAG_DOMINANCE_MIN = 1
const IMAGE_TAG_DOMINANCE_MIN = 2

function normalizeEnclosure(enclosure: Parser.Item['enclosure']) {
  if (!enclosure || typeof enclosure !== 'object') {
    return undefined
  }

  return {
    ...enclosure,
    length: enclosure.length ? Number(enclosure.length) : undefined,
  }
}

function inferImageMimeType(url: string) {
  const normalizedUrl = url.split('?')[0]?.toLowerCase() ?? ''

  if (normalizedUrl.endsWith('.png')) return 'image/png'
  if (normalizedUrl.endsWith('.webp')) return 'image/webp'
  if (normalizedUrl.endsWith('.gif')) return 'image/gif'
  if (normalizedUrl.endsWith('.svg')) return 'image/svg+xml'
  if (normalizedUrl.endsWith('.avif')) return 'image/avif'
  if (normalizedUrl.endsWith('.jpg') || normalizedUrl.endsWith('.jpeg')) return 'image/jpeg'

  return 'image/*'
}

function extractImageEnclosureFromContent(content?: string | null) {
  if (!content) return undefined

  const src = content.match(IMG_SRC_PATTERN)?.[2]?.trim()
  if (!src) return undefined

  return {
    url: src,
    type: inferImageMimeType(src),
  }
}

function stripHtmlToText(content: string) {
  return content
    .replace(COMMENT_PATTERN, ' ')
    .replace(SCRIPT_STYLE_PATTERN, ' ')
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

function getMeaningfulTextLength(content: string) {
  return stripHtmlToText(content)
    .replace(/\s+/g, '')
    .length
}

function countPattern(content: string, pattern: RegExp) {
  return content.match(pattern)?.length ?? 0
}

function stripToStructuralShell(content: string) {
  return content
    .replace(COMMENT_PATTERN, '')
    .replace(SCRIPT_STYLE_PATTERN, '')
    .replace(WRAPPER_TAG_PATTERN, '')
    .replace(SELF_CLOSING_MEDIA_PATTERN, '')
    .replace(VIDEO_TAG_PATTERN, '')
    .replace(/\s+/g, '')
    .trim()
}

function resolveDominantContentType(counts: Record<ContentKind, number>): ContentKind {
  if (counts.image > counts.article && counts.image > counts.video) return 'image'
  if (counts.video > counts.article && counts.video > counts.image) return 'video'
  return 'article'
}

function classifyContentType(content?: string | null): ContentKind {
  if (!content) return 'article'

  const imageCount = countPattern(content, IMG_TAG_PATTERN)
  const videoCount = countPattern(content, VIDEO_TAG_PATTERN)
  const textBlockCount = countPattern(content, TEXT_BLOCK_TAG_PATTERN)
  const lightTextTagCount = countPattern(content, LIGHT_TEXT_TAG_PATTERN)
  const textLength = getMeaningfulTextLength(content)
  const shell = stripToStructuralShell(content)

  // 优先看标签结构。
  // 视频稿经常带较长简介，但结构上仍是“1 个视频主体 + 少量文本块/轻量标签”。
  if (videoCount > 0) {
    const looksVideoDominantByTags =
      videoCount >= VIDEO_TAG_DOMINANCE_MIN &&
      textBlockCount <= VIDEO_TEXT_BLOCK_MAX &&
      lightTextTagCount <= VIDEO_LIGHT_TAG_MAX
    if (looksVideoDominantByTags) {
      return 'video'
    }

    return textLength <= VIDEO_TEXT_MAX ? 'video' : 'article'
  }

  if (imageCount > 0) {
    const imageDominantTagLimit = Math.max(IMAGE_LIGHT_TAG_BASE_MAX, imageCount * 2)
    const looksImageDominantByTags =
      imageCount >= IMAGE_TAG_DOMINANCE_MIN &&
      textBlockCount <= IMAGE_TEXT_BLOCK_MAX &&
      lightTextTagCount <= imageDominantTagLimit

    if (looksImageDominantByTags) {
      return 'image'
    }

    if (textLength > 0) {
      const imageDominantTextLimit = Math.max(IMAGE_TEXT_MAX, imageCount * IMAGE_TEXT_PER_ASSET)
      if (textLength <= imageDominantTextLimit && textBlockCount <= IMAGE_TEXT_BLOCK_MAX) {
        return 'image'
      }
    }

    if (!shell) {
      return 'image'
    }
  }

  return 'article'
}

export async function fetchAllFeeds() {
  const limit = pLimit(10)
  const feeds = await feedRepo.list()

  const tasks = feeds.map(feed => limit(async () => {
    try {
      console.log(`[RSS] fetching feed: ${feed.url}`)
      await fetchSingleFeed(feed)
    } catch (err) {
      console.error(`[RSS] fetch failed: ${feed.url}`, err)
    }
  }))

  await Promise.all(tasks)
}

export async function fetchSingleFeed(feed: SelectFeed) {
  await feedRepo.update(feed.id, { status: 'pending' })

  const feedInfo = await parser.parseURL(feed.url)
  if (!feedInfo) {
    await feedRepo.update(feed.id, { status: 'blocked' })
    throw Error
  }

  for (const item of feedInfo.items) {
    const article: InsertArticle | null = mapRssItem(feed.id, item)
    if (!article) continue

    await upsertArticle(article)
  }

  const counts = await articleRepo.getContentTypeCountsByFeedId(feed.id)

  await feedRepo.update(feed.id, {
    status: 'active',
    contentType: resolveDominantContentType(counts),
    articleContentCount: counts.article,
    imageContentCount: counts.image,
    videoContentCount: counts.video,
    lastFetchedAt: new Date(),
  })
}

function mapRssItem(feedId: number, item: { [key: string]: any } & Parser.Item): InsertArticle | null {
  const key = item.guid ?? item.link
  if (!key) return null

  const content = item['content:encoded'] || item.content
  const enclosure = normalizeEnclosure(item.enclosure) ?? extractImageEnclosureFromContent(content)
  const contentType = classifyContentType(content)

  return {
    feedId,
    title: item.title,
    link: item.link,
    contentType,
    summary: item.summary || item.contentSnippet?.slice(0, 200),
    content,
    contentSnippet: item['content:encodedSnippet'] || item.contentSnippet,
    author: item.creator,
    enclosure,
    guid: item.guid,
    pubDate: item.pubDate ? new Date(item.pubDate) : null,
  }
}

async function upsertArticle(item: InsertArticle) {
  const key = item.guid || item.link
  if (!key) return

  const existing = await articleRepo.findByGuidOrLink(key)
  if (!existing) {
    // console.log(item)
    await articleRepo.create(item)
    return
  }

  // 内容是否变化（避免无意义 update）
  const shouldUpdate =
    existing.title !== item.title ||
    existing.contentType !== item.contentType ||
    existing.content !== item.content ||
    existing.summary !== item.summary ||
    JSON.stringify(existing.enclosure ?? null) !== JSON.stringify(item.enclosure ?? null)

  if (!shouldUpdate) return

  await articleRepo.update(existing.id, {
    title: item.title,
    contentType: item.contentType,
    summary: item.summary,
    content: item.content,
    contentSnippet: item.contentSnippet,
    author: item.author,
    enclosure: item.enclosure,
    pubDate: item.pubDate,
  })
}
