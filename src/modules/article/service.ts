import { AppError } from '@server/utils/error'

export const BEHAVIOR_SCORE = {
  click: 1,
  read: 2,
  favorite: 6,
  share: 8,
} as const

export function calcReadScore(progress: number): number {
  if (progress <= 30) return 1
  if (progress <= 70) return 2
  return 4
}

export function assertProgress(progress: number): void {
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
    throw new AppError(422, '阅读进度必须在 0 到 100 之间', 'INVALID_PROGRESS')
  }
}
