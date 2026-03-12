import { useEffect, useRef } from 'react'

type UseInfiniteScrollParams = {
  disabled?: boolean
  onLoadMore: () => void
}

export const useInfiniteScroll = ({ disabled = false, onLoadMore }: UseInfiniteScrollParams) => {
  const targetRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = targetRef.current
    if (!node || disabled) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [disabled, onLoadMore])

  return { targetRef }
}
