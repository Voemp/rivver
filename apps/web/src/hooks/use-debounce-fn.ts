import { useEffect, useRef } from 'react'

type UseDebounceFnOptions = {
  /** 防抖等待时间（毫秒） */
  wait: number
}

/**
 * 对 `fn` 做尾沿防抖：连续调用只会以最后一次的参数执行一次。
 * 定时器触发时读取的是最新渲染的 `fn`；组件卸载会取消尚未执行的调用。
 */
export function useDebounceFn<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  { wait }: UseDebounceFnOptions,
) {
  const fnRef = useRef(fn)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const run = (...args: TArgs) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      fnRef.current(...args)
    }, wait)
  }

  return { run }
}
