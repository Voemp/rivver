export type Article = {
  id: number
  feedId: number
  title: string
  link?: string | null
  content?: string | null
  contentSnippet?: string | null
  summary?: string | null
  author?: string | null
  pubDate?: string | null
  enclosure?: { url?: string; type?: string; length?: string } | null
  feed?: Feed | null
}

export type Feed = {
  id: number
  title: string
  description?: string | null
  url: string
  link?: string | null
  image?: string | null
  subscriberCount: number
  lastFetchedAt?: string | null
}

export type Subscription = {
  id: number
  feedId?: number
  title: string
  url: string
  description?: string | null
  image?: string | null
  link?: string | null
  subscriberCount: number
  lastFetchedAt?: string | null
  customTitle?: string | null
  feed?: Feed | null
}

export type FavoriteStatus = {
  favorited: boolean
}

export type SubscriptionStatus = {
  subscribed: boolean
}

export type ArticleItem = {
  id: number
  title: string
  contentSnippet?: string | null
  pubDate?: string | null
  author?: string | null
  enclosure?: { url?: string; type?: string } | null
  feed?: { id: number; title: string; image?: string | null } | null
}
