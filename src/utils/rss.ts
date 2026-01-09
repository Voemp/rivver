import Parser from 'rss-parser'
import { SelectLink } from '../db/schema'
import linksRepo from '../repositories/linksRepo'

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

async function fetchSingleFeed(link: SelectLink) {
  const items = await parseRss(link.url)

  for (const item of items) {
    // await upsertContent(item, link)
  }
}

async function runRssFetch() {
  const links = await linksRepo().list()

  for (const link of links) {
    await fetchSingleFeed(link)
  }
}
