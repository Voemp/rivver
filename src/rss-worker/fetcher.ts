import Parser from 'rss-parser'
import { InsertArticle, SelectFeed } from '../database/schema'
import { articleRepo } from '../repositories/articleRepo'
import { feedRepo } from '../repositories/feedRepo'

const parser = new Parser()

export async function fetchAllFeeds() {
  const feeds = await feedRepo.list()

  for (const feed of feeds) {
    try {
      await fetchSingleFeed(feed)
    } catch (err) {
      console.error(`[RSS] feed failed: ${feed.url}`, err)
    }
  }
}

async function fetchSingleFeed(feed: SelectFeed) {
  const feedInfo = await parser.parseURL(feed.url)

  for (const item of feedInfo.items) {
    const article: InsertArticle | null = mapRssItem(feed.id, item)
    if (!article) continue

    await upsertArticle(article)
  }
}

function mapRssItem(feedId: number, item: { [key: string]: any } & Parser.Item): InsertArticle | null {
  const key = item.guid ?? item.link
  if (!key) return null

  return {
    feedId,
    title: item.title,
    link: item.link,
    summary: item.summary || item.contentSnippet?.slice(0, 200),
    content: item['content:encoded'] || item.content,
    contentSnippet: item['content:encodedSnippet'] || item.contentSnippet,
    author: item.creator,
    enclosure: item.enclosure && typeof item.enclosure === 'object'
      ? { ...item.enclosure, length: Number(item.enclosure.length) }
      : undefined,
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
    existing.content !== item.content ||
    existing.summary !== item.summary

  if (!shouldUpdate) return

  await articleRepo.update(existing.id, {
    title: item.title,
    summary: item.summary,
    content: item.content,
    contentSnippet: item.contentSnippet,
    author: item.author,
    pubDate: item.pubDate,
  })
}
