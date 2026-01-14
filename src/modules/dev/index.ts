import { Elysia, t } from 'elysia'
import Parser from 'rss-parser'

export const dev = new Elysia({ prefix: '/dev' })
  .post('/parse-rss', async ({ body }) => {
    const parser = new Parser()
    const feedInfo = await parser.parseURL(body.url)
    return feedInfo.items.map(item => ({
      title: item.title,
      link: item.link,
      summary: item.summary || item.contentSnippet?.slice(0, 200),
      content: item['content:encoded'] || item.content,
      contentSnippet: item['content:encodedSnippet'] || item.contentSnippet,
      author: item.creator,
      enclosure: item.enclosure,
      guid: item.guid,
      pubDate: item.pubDate ? new Date(item.pubDate) : null,
    }))[0]
  }, {
    body: t.Object({
      url: t.String({ format: 'uri' }),
    }),
  })
