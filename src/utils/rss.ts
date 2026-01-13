import Parser from 'rss-parser'
import { InsertArticle, SelectFeed } from '../database/schema'
import { feedRepo } from '../repositories/feedRepo'

const parser = new Parser()

async function parseRss(url: string): Promise<InsertArticle[]> {
  const feed = await feedRepo.findByUrl(url)
  if (!feed) throw new Error('Could not parse feed')

  const feedInfo = await parser.parseURL(url)

  return feedInfo.items.map(item => ({
    feedId: feed.id,
    title: item.title,
    link: item.link,
    summary: item.summary || item.contentSnippet,
    content: item['content:encoded'] || item.content,
    contentSnippet: item['content:encodedSnippet'] || item.contentSnippet,
    author: item.creator,
    enclosure: item.enclosure,
    guid: item.guid,
    pubDate: item.pubDate ? new Date(item.pubDate) : null,
  }))
}

async function fetchSingleFeed(feed: SelectFeed) {
  const items = await parseRss(feed.url)

  for (const item of items) {
    // await upsertContent(item, link)
  }
}

async function runRssFetch() {
  const feeds = await feedRepo.list()

  for (const feed of feeds) {
    await fetchSingleFeed(feed)
  }
}
