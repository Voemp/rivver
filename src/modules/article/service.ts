import { articleRepo } from '@server/repos/articleRepo'
import { behaviorRepo } from '@server/repos/behaviorRepo'
import { interestRepo } from '@server/repos/interestRepo'
import { recommendRepo } from '@server/repos/recommendRepo'
import { AppError } from '@server/utils/error'

const INTEREST_DIMENSIONS = 384
const MAX_BEHAVIORS = 100
const MAX_RECOMMENDATIONS = 200

export const BEHAVIOR_SCORE = {
  click: 1,
  read: 2,
  favorite: 6,
  share: 8,
} as const

function createZeroVector() {
  return Array.from({ length: INTEREST_DIMENSIONS }, () => 0)
}

function getBehaviorWeight(score: number, createdAt?: Date | null) {
  const ageInDays = createdAt
    ? Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const recencyFactor = 1 / (1 + ageInDays / 7)
  return score * recencyFactor
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (magnitude === 0) return null

  return vector.map(value => value / magnitude)
}

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

export async function refreshUserInterest(userId: string) {
  const rows = await behaviorRepo.listWeightedForInterest(userId, MAX_BEHAVIORS)

  if (rows.length === 0) {
    return null
  }

  const vector = createZeroVector()
  let articleCount = 0
  let totalWeight = 0

  for (const row of rows) {
    const embedding = row.embedding
    if (!embedding || embedding.length !== INTEREST_DIMENSIONS) continue

    const weight = getBehaviorWeight(row.score, row.createdAt)
    if (weight <= 0) continue

    articleCount += 1
    totalWeight += weight

    for (let index = 0; index < embedding.length; index++) {
      vector[index] += embedding[index] * weight
    }
  }

  if (articleCount === 0 || totalWeight === 0) {
    return null
  }

  const averaged = vector.map(value => value / totalWeight)
  const normalized = normalizeVector(averaged)
  if (!normalized) return null

  return interestRepo.upsert(userId, normalized, articleCount)
}

export async function seedUserRecommendations(userId: string) {
  const interest = await interestRepo.findByUser(userId)
  const seenArticleIds = await behaviorRepo.listSeenArticleIds(userId)

  if (!interest?.interestVector?.length) {
    return []
  }

  const candidateIds = await articleRepo.listByUserInterest(
    interest.interestVector,
    seenArticleIds,
    MAX_RECOMMENDATIONS,
  )

  const fallbackIds = candidateIds.length < MAX_RECOMMENDATIONS
    ? await articleRepo.listFallbackForRecommendation(
      [...seenArticleIds, ...candidateIds],
      MAX_RECOMMENDATIONS - candidateIds.length,
    )
    : []

  const articleIds = [...candidateIds, ...fallbackIds]

  await recommendRepo.clearByUser(userId)

  await Promise.all(articleIds.map((articleId, rank) => recommendRepo.create({
    userId,
    articleId,
    rank,
  })))

  return articleIds
}
