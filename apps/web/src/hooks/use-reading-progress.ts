import { postReadProgress } from '@/api/queries'
import { env } from '@/config/env'
import { useCallback, useEffect, useRef, useState } from 'react'

type UseReadingProgressParams = {
  articleId: number
}

type HeadingProgressItem = {
  id: string
  text: string
  level: number
  progress: number
  active: boolean
}

const SCROLL_IDLE_MS = 1200
const MIN_PROGRESS_DELTA = 2

const clampProgress = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const buildReadProgressUrl = (articleId: number) =>
  `${env.apiBaseUrl}/article/${articleId}/read-progress`

export const useReadingProgress = ({ articleId }: UseReadingProgressParams) => {
  const [progress, setProgress] = useState(0)
  const [headings, setHeadings] = useState<HeadingProgressItem[]>([])

  const latestProgressRef = useRef(0)
  const lastSentProgressRef = useRef(-1)
  const idleTimerRef = useRef<number | null>(null)
  const inFlightRef = useRef(false)
  const queuedProgressRef = useRef<number | null>(null)
  const unmountedRef = useRef(false)

  const sendProgress = useCallback(
    async (value: number, force = false) => {
      const normalized = clampProgress(value)
      const lastSent = lastSentProgressRef.current
      const delta = Math.abs(normalized - lastSent)

      if (!force && normalized !== 100 && lastSent >= 0 && delta < MIN_PROGRESS_DELTA) {
        return
      }

      if (inFlightRef.current) {
        queuedProgressRef.current = normalized
        return
      }

      // 循环消化排队进度，替代原来的递归调用（React Compiler 无法保持递归 useCallback 的记忆化）
      let current: number | null = normalized
      while (current !== null) {
        inFlightRef.current = true
        try {
          await postReadProgress(articleId, current)
          lastSentProgressRef.current = current
        } catch {
          // 进度上报失败时静默降级，避免影响阅读体验。
        } finally {
          inFlightRef.current = false
        }

        const queued = queuedProgressRef.current
        queuedProgressRef.current = null
        if (queued !== null && queued !== lastSentProgressRef.current && !unmountedRef.current) {
          current = queued
          continue
        }
        current = null
      }
    },
    [articleId],
  )

  const flushOnPageLeave = useCallback(
    (value: number) => {
      const normalized = clampProgress(value)
      if (normalized === lastSentProgressRef.current) {
        return
      }

      const payload = JSON.stringify({ progress: normalized })
      const endpoint = buildReadProgressUrl(articleId)

      let beaconSent = false
      if (typeof navigator.sendBeacon === 'function') {
        beaconSent = navigator.sendBeacon(
          endpoint,
          new Blob([payload], { type: 'application/json' }),
        )
      }

      if (!beaconSent) {
        void fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }

      lastSentProgressRef.current = normalized
    },
    [articleId],
  )

  useEffect(() => {
    unmountedRef.current = false
    latestProgressRef.current = 0
    lastSentProgressRef.current = -1
    queuedProgressRef.current = null
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }

    const contentRoot = document.querySelector('article')
    if (!contentRoot) {
      return
    }

    const titleNodes = Array.from(contentRoot.querySelectorAll<HTMLHeadingElement>('h1, h2, h3'))
    // headings 以函数式 setState 从 DOM 派生初始化，与后续滚动更新走同一条更新路径
    const buildInitialHeadings = (): HeadingProgressItem[] =>
      titleNodes.map((node, index) => {
        if (!node.id) {
          node.id = `heading-${index}`
        }
        return {
          id: node.id,
          text: node.innerText,
          level: Number(node.tagName[1]),
          progress: 0,
          active: false,
        }
      })

    const updateHeadingProgress = (initial?: HeadingProgressItem[]) => {
      const viewportOffset = window.innerHeight * 0.24

      setHeadings((current) => {
        const base = current.length > 0 ? current : (initial ?? [])
        if (base.length === 0) {
          return base
        }

        return base.map((heading, index) => {
          const node = document.getElementById(heading.id)
          if (!node) {
            return heading
          }

          const currentTop = node.getBoundingClientRect().top + window.scrollY
          const nextNode =
            index < base.length - 1 ? document.getElementById(base[index + 1].id) : null
          const nextTop = nextNode
            ? nextNode.getBoundingClientRect().top + window.scrollY
            : document.documentElement.scrollHeight - window.innerHeight + viewportOffset

          const range = Math.max(nextTop - currentTop, 1)
          const raw = ((window.scrollY + viewportOffset - currentTop) / range) * 100
          const itemProgress = Math.max(0, Math.min(100, Math.round(raw)))
          const isActive = itemProgress > 0 && itemProgress < 100

          return {
            ...heading,
            progress: itemProgress,
            active: isActive,
          }
        })
      })
    }

    const scheduleIdleSend = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current)
      }

      idleTimerRef.current = window.setTimeout(() => {
        void sendProgress(latestProgressRef.current)
      }, SCROLL_IDLE_MS)
    }

    const updateReadingProgress = (initialHeadings?: HeadingProgressItem[]) => {
      const scrollTop = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const next =
        scrollHeight <= 0
          ? 100
          : Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)))
      setProgress(next)
      latestProgressRef.current = next
      updateHeadingProgress(initialHeadings)
    }

    const onScroll = () => {
      updateReadingProgress()
      scheduleIdleSend()
    }

    const onResize = () => {
      updateReadingProgress()
      scheduleIdleSend()
    }

    const flushForLeave = () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      flushOnPageLeave(latestProgressRef.current)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') {
        return
      }
      flushForLeave()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', flushForLeave)
    window.addEventListener('beforeunload', flushForLeave)

    updateReadingProgress(buildInitialHeadings())

    return () => {
      unmountedRef.current = true

      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', flushForLeave)
      window.removeEventListener('beforeunload', flushForLeave)

      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }

      void sendProgress(latestProgressRef.current, true)
    }
  }, [articleId, flushOnPageLeave, sendProgress])

  return {
    progress,
    headings,
  }
}
