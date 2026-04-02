import { ArticleContentCard } from '@/components/article/article-content-card'
import { type FeedInfo } from '@/components/feed/feed-info-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { contentTypeLabels } from '@/types/content'
import { formatRecentTime } from '@/utils/date'
import { ChevronLeft, ChevronRight, ImageIcon, PlayCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type MediaArticle = {
  id: number
  title: string | null
  author: string | null
  pubDate: Date | null
  content: string | null
  contentType: 'article' | 'image' | 'video'
  enclosure?: {
    url: string
    type?: string
    length?: number
  } | null
}

type ParsedVideoEmbed =
  | {
  kind: 'iframe'
  src: string
  title?: string | null
  allow?: string | null
  allowFullScreen: boolean
}
  | {
  kind: 'video'
  src: string
  poster?: string | null
}
  | {
  kind: 'embed'
  src: string
  type?: string | null
}

type ParsedMediaContent = {
  images: string[]
  textContent: string | null
  videoEmbed: ParsedVideoEmbed | null
}

type ArticleMediaDetailProps = {
  article: MediaArticle
  feed: FeedInfo
}

const EMPTY_WRAPPER_PATTERN = /<(div|section|figure|picture|p|span)[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi
const TAG_PATTERN = /<[^>]+>/g
const WHITESPACE_PATTERN = /\s+/g

function extractMediaFallback(content?: string | null, enclosure?: MediaArticle['enclosure']): ParsedMediaContent {
  const contentValue = content ?? ''
  const imageMatches = Array.from(contentValue.matchAll(/<img\b[^>]*\bsrc=(['"]?)([^'" >]+)\1/gi))
    .map((match) => match[2]?.trim())
    .filter((value): value is string => Boolean(value))
  const enclosureImage = enclosure?.type?.startsWith('image/') && enclosure.url ? [enclosure.url] : []
  const images = [...new Set([...imageMatches, ...enclosureImage])]
  const iframeMatch = contentValue.match(/<iframe\b[^>]*\bsrc=(['"]?)([^'" >]+)\1[^>]*>/i)
  const videoMatch = contentValue.match(/<video\b[^>]*\bsrc=(['"]?)([^'" >]+)\1[^>]*>/i)
  const embedMatch = contentValue.match(/<embed\b[^>]*\bsrc=(['"]?)([^'" >]+)\1[^>]*>/i)
  const textContent = contentValue
    .replace(/<(img|iframe|video|embed|source|picture)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(img|iframe|video|embed|source|picture)\b[^>]*\/?>/gi, ' ')
    .replace(EMPTY_WRAPPER_PATTERN, '')
    .trim()

  if (iframeMatch?.[2]) {
    return {
      images,
      textContent,
      videoEmbed: {
        kind: 'iframe',
        src: iframeMatch[2],
        allowFullScreen: /allowfullscreen/i.test(iframeMatch[0]),
      },
    }
  }

  if (videoMatch?.[2]) {
    return {
      images,
      textContent,
      videoEmbed: {
        kind: 'video',
        src: videoMatch[2],
      },
    }
  }

  if (embedMatch?.[2]) {
    return {
      images,
      textContent,
      videoEmbed: {
        kind: 'embed',
        src: embedMatch[2],
      },
    }
  }

  return {
    images,
    textContent,
    videoEmbed: null,
  }
}

function hasMeaningfulText(content: string) {
  return content.replace(TAG_PATTERN, ' ').replace(WHITESPACE_PATTERN, '').length > 0
}

function parseMediaContent(content?: string | null, enclosure?: MediaArticle['enclosure']): ParsedMediaContent {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return extractMediaFallback(content, enclosure)
  }

  const doc = new DOMParser().parseFromString(content ?? '', 'text/html')
  const imageUrls = Array.from(doc.querySelectorAll('img'))
    .map(node => node.getAttribute('src')?.trim())
    .filter((value): value is string => Boolean(value))
  const enclosureImage = enclosure?.type?.startsWith('image/') && enclosure.url ? [enclosure.url] : []
  const images = [...new Set([...imageUrls, ...enclosureImage])]

  const mediaNode = doc.querySelector('iframe, video, embed')
  let videoEmbed: ParsedVideoEmbed | null = null

  if (mediaNode instanceof HTMLIFrameElement && mediaNode.src) {
    videoEmbed = {
      kind: 'iframe',
      src: mediaNode.src,
      title: mediaNode.title,
      allow: mediaNode.getAttribute('allow'),
      allowFullScreen: mediaNode.hasAttribute('allowfullscreen'),
    }
  } else if (mediaNode instanceof HTMLVideoElement) {
    const source = mediaNode.currentSrc || mediaNode.src || mediaNode.querySelector('source')?.src
    if (source) {
      videoEmbed = {
        kind: 'video',
        src: source,
        poster: mediaNode.poster,
      }
    }
  } else if (mediaNode instanceof HTMLEmbedElement && mediaNode.src) {
    videoEmbed = {
      kind: 'embed',
      src: mediaNode.src,
      type: mediaNode.type,
    }
  } else if (mediaNode) {
    const src = mediaNode.getAttribute('src')
    if (src) {
      videoEmbed = {
        kind: mediaNode.tagName.toLowerCase() === 'embed' ? 'embed' : 'iframe',
        src,
        allowFullScreen: mediaNode.hasAttribute('allowfullscreen'),
        allow: mediaNode.getAttribute('allow'),
        title: mediaNode.getAttribute('title'),
      }
    }
  }

  for (const node of doc.querySelectorAll('img, iframe, video, embed, source, picture')) {
    node.remove()
  }

  const textContent = doc.body.innerHTML
    .replace(EMPTY_WRAPPER_PATTERN, '')
    .trim()

  return {
    images,
    textContent: hasMeaningfulText(textContent) ? textContent : null,
    videoEmbed,
  }
}

function getFeedFallback(title: string) {
  const trimmed = title.trim()
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : 'F'
}

function MediaMetaBlock({
                          article,
                          feed,
                          extraLabel,
                        }: {
  article: MediaArticle
  feed: FeedInfo
  extraLabel: string
}) {
  return (
    <header className="mx-auto max-w-3xl pt-1">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
        <span className="inline-flex items-center text-foreground/86">
          {contentTypeLabels[article.contentType]}
        </span>
        <span className="h-3 w-px bg-border/70" />
        <span>{extraLabel}</span>
      </div>

      <h1 className="mt-3 text-xl font-semibold leading-8 tracking-[-0.02em] text-foreground sm:text-2xl sm:leading-9">
        {article.title ?? '未命名内容'}
      </h1>

      <div className="mt-5 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-3 lg:grid-cols-2">
        <div className="flex min-w-0 items-center gap-3 lg:hidden">
          <Avatar className="size-8 ring-1 ring-border/60">
            <AvatarImage src={feed.image ?? undefined} alt={feed.title} />
            <AvatarFallback className="text-xs font-semibold">
              {getFeedFallback(feed.title)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/75">来源</p>
            <p className="truncate text-sm font-medium text-foreground">{feed.title}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/75">Author</p>
          <p className="mt-1 text-sm font-medium text-foreground">{article.author ?? 'Unknown'}</p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/75">Published</p>
          <p className="mt-1 text-sm font-medium text-foreground">{formatRecentTime(article.pubDate) || '未知时间'}</p>
        </div>
      </div>
    </header>
  )
}

export const ArticleMediaDetail = ({ article, feed }: ArticleMediaDetailProps) => {
  const { images, textContent, videoEmbed } = useMemo(
    () => parseMediaContent(article.content, article.enclosure),
    [article.content, article.enclosure],
  )
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const currentImage = images[activeImageIndex] ?? null

  useEffect(() => {
    setActiveImageIndex(0)
  }, [article.id])

  useEffect(() => {
    if (article.contentType !== 'image') {
      setIsImageLoading(false)
      return
    }

    setIsImageLoading(Boolean(currentImage))
  }, [article.contentType, currentImage])

  if (article.contentType === 'image') {
    const imageCount = images.length

    return (
      <section className="space-y-5">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden bg-muted/24">
            <div
              className="absolute top-4 left-4 z-10 bg-background/88 px-2.5 py-1 text-xs font-medium text-foreground/88">
              {imageCount > 0 ? `${activeImageIndex + 1} / ${imageCount}` : '暂无图片'}
            </div>

            <div
              className="relative flex h-92 items-center justify-center overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.14),transparent_58%)] px-4 py-8 sm:h-124 sm:px-8 lg:h-152">
              {currentImage ? (
                <>
                  <img
                    key={currentImage}
                    src={currentImage}
                    alt={article.title ?? '图片内容'}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    onLoad={() => setIsImageLoading(false)}
                    onError={() => setIsImageLoading(false)}
                    className={cn(
                      'h-full w-full object-contain transition-opacity duration-250',
                      isImageLoading ? 'opacity-0' : 'opacity-100',
                    )}
                  />
                  {isImageLoading ? (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/72 backdrop-blur-[1px]">
                      <Spinner className="size-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">图片加载中</p>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <ImageIcon className="size-10" />
                  <p className="text-sm">当前内容没有可展示的图片</p>
                </div>
              )}

              {imageCount > 1 ? (
                <>
                  <Button
                    variant="outline"
                    size="icon-lg"
                    className="absolute left-4 rounded-full border-border/60 bg-background/88 sm:left-6"
                    onClick={() => setActiveImageIndex(index => (index - 1 + imageCount) % imageCount)}
                    aria-label="上一张"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-lg"
                    className="absolute right-4 rounded-full border-border/60 bg-background/88 sm:right-6"
                    onClick={() => setActiveImageIndex(index => (index + 1) % imageCount)}
                    aria-label="下一张"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <MediaMetaBlock
          article={article}
          feed={feed}
          extraLabel={imageCount > 1 ? `共 ${imageCount} 张图片` : '单张图片'}
        />

        {textContent ? (
          <ArticleContentCard
            content={textContent}
            className="mt-0"
            contentClassName="[&_p]:my-4 [&_h1]:mt-10 [&_h2]:mt-10 [&_h3]:mt-8"
          />
        ) : null}
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden bg-muted/24">
          <div className="aspect-video overflow-hidden rounded-xl border bg-muted/35">
            {videoEmbed?.kind === 'iframe' ? (
              <iframe
                src={videoEmbed.src}
                title={videoEmbed.title ?? article.title ?? '视频内容'}
                allow={videoEmbed.allow ?? undefined}
                allowFullScreen={videoEmbed.allowFullScreen}
                referrerPolicy="no-referrer"
                className="size-full border-0"
              />
            ) : videoEmbed?.kind === 'video' ? (
              <video
                src={videoEmbed.src}
                poster={videoEmbed.poster ?? undefined}
                controls
                playsInline
                className="size-full bg-black object-contain"
              />
            ) : videoEmbed?.kind === 'embed' ? (
              <embed
                src={videoEmbed.src}
                type={videoEmbed.type ?? undefined}
                className="size-full"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <PlayCircle className="size-11" />
                <p className="text-sm">当前内容没有可展示的视频</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaMetaBlock article={article} feed={feed} extraLabel="视频内容" />

      {textContent ? (
        <ArticleContentCard
          content={textContent}
          className="mt-0"
          contentClassName="[&_p]:my-4 [&_h1]:mt-10 [&_h2]:mt-10 [&_h3]:mt-8"
        />
      ) : null}
    </section>
  )
}
