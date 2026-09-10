import { useEffect } from 'react'

/**
 * 仅在组件挂载时执行一次的 effect。
 * `effect` 故意不加入依赖数组：挂载即运行、只运行一次正是这个 hook 的语义，
 * 与 React 文档对“运行一次”模式的豁免一致。
 */
export function useMountEffect(effect: () => void | (() => void)) {
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- 挂载时仅运行一次是有意为之
  useEffect(effect, [])
}
