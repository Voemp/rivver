import Parser from 'rss-parser'
import { SelectFeed } from '../database/schema'
import { feedRepo } from '../repositories/feedRepo'

const parser = new Parser()

async function parseRss(url: string) {
  const feed = await parser.parseURL(url)

  return feed.items.map(item => ({
    title: item.title,
    link: item.link,
    guid: item.guid,
    pubDate: item.pubDate,
    content: item['content:encoded'] || item.content,
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
