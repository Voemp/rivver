import type { ContentKind } from '@server/db/schema'
import { articleRepo } from '@server/repos/articleRepo'
import { behaviorRepo } from '@server/repos/behaviorRepo'
import { interestRepo } from '@server/repos/interestRepo'
import { recommendRepo } from '@server/repos/recommendRepo'
import { AppError } from '@server/utils/error'

const INTEREST_DIMENSIONS = 384
const MAX_BEHAVIORS = 100
const MAX_RECOMMENDATIONS = 200
const MAX_RECOMMENDATION_CANDIDATES = 400
const DIVERSIFIED_CANDIDATE_MULTIPLIER = 3
const POPULAR_SCORE_WEIGHT = 0.7
const POPULAR_RECENCY_WEIGHT = 0.3
const POPULAR_RECENCY_HALF_LIFE_DAYS = 7
const ARTICLE_SEMANTIC_WEIGHT = 0.66
const ARTICLE_FEED_WEIGHT = 0.08
const ARTICLE_TYPE_WEIGHT = 0.04
const ARTICLE_RECENT_FEED_WEIGHT = 0.12
const ARTICLE_RECENT_TYPE_WEIGHT = 0.06
const ARTICLE_POPULARITY_WEIGHT = 0.16
const MEDIA_SEMANTIC_WEIGHT = 0.02
const MEDIA_FEED_WEIGHT = 0.12
const MEDIA_TYPE_WEIGHT = 0.08
const MEDIA_RECENT_FEED_WEIGHT = 0.22
const MEDIA_RECENT_TYPE_WEIGHT = 0.16
const MEDIA_POPULARITY_WEIGHT = 0.24
const FEED_WEIGHT_CAP = 0.68
const CONTENT_TYPE_WEIGHT_CAP = 0.58
const SAME_FEED_RECENT_PENALTY = 0.22
const SAME_TYPE_RECENT_PENALTY = 0.12
const SAME_FEED_REPEAT_PENALTY = 0.1
const SAME_TYPE_REPEAT_PENALTY = 0.06
const DIVERSITY_LOOKBACK = 3
const RECENT_SIGNAL_WINDOW = 10
const RANKING_RANDOM_JITTER = 0.045
const DIVERSITY_RANDOM_POOL_SIZE = 4

type PopularityCandidate = {
  id: number
  pubDate: Date | null
  createdAt: Date
  totalScore: number | null
}

type WeightedSignal = Awaited<ReturnType<typeof behaviorRepo.listWeightedSignals>>[number]
type RecommendationCandidate = Awaited<ReturnType<typeof articleRepo.listRecommendationCandidates>>[number]
type RankedRecommendationCandidate = {
  candidate: RecommendationCandidate
  score: number
  baseDateMs: number
}
type PreferenceProfile = {
  interestVector: number[] | null
  feedWeights: Map<number, number>
  recentFeedWeights: Map<number, number>
  contentTypeWeights: Record<ContentKind, number>
  recentContentTypeWeights: Record<ContentKind, number>
}

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

function normalizeWeightMap<T>(entries: Map<T, number>) {
  const normalized = new Map<T, number>()
  const totalWeight = Array.from(entries.values()).reduce((sum, value) => sum + value, 0)

  if (totalWeight <= 0) {
    return normalized
  }

  for (const [key, value] of entries.entries()) {
    const share = Math.max(0, value / totalWeight)
    normalized.set(key, Math.min(FEED_WEIGHT_CAP, Math.sqrt(share)))
  }

  return normalized
}

function normalizeContentTypeWeights(entries: Record<ContentKind, number>): Record<ContentKind, number> {
  const totalWeight = entries.article + entries.image + entries.video
  if (totalWeight <= 0) {
    return {
      article: 0,
      image: 0,
      video: 0,
    }
  }

  return {
    article: Math.min(CONTENT_TYPE_WEIGHT_CAP, Math.sqrt(entries.article / totalWeight)),
    image: Math.min(CONTENT_TYPE_WEIGHT_CAP, Math.sqrt(entries.image / totalWeight)),
    video: Math.min(CONTENT_TYPE_WEIGHT_CAP, Math.sqrt(entries.video / totalWeight)),
  }
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) return 0

  let dot = 0
  let aMagnitude = 0
  let bMagnitude = 0

  for (let index = 0; index < a.length; index++) {
    const aValue = a[index] ?? 0
    const bValue = b[index] ?? 0
    dot += aValue * bValue
    aMagnitude += aValue * aValue
    bMagnitude += bValue * bValue
  }

  if (aMagnitude === 0 || bMagnitude === 0) return 0

  return Math.max(0, dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude)))
}

function calcPopularityScore(candidate: PopularityCandidate, nowMs: number, baseDateMs: number) {
  const ageInDays = Math.max(0, (nowMs - baseDateMs) / (1000 * 60 * 60 * 24))
  const rawScore = Number(candidate.totalScore ?? 0)
  const scoreComponent = Math.log(1 + Math.max(0, rawScore))
  const recencyComponent = 1 / (1 + ageInDays / POPULAR_RECENCY_HALF_LIFE_DAYS)

  return (POPULAR_SCORE_WEIGHT * scoreComponent) + (POPULAR_RECENCY_WEIGHT * recencyComponent)
}

function rankPopularityCandidates<T extends PopularityCandidate>(candidates: T[]): T[] {
  const nowMs = Date.now()
  const ranked = candidates.map((candidate) => {
    const baseDate = candidate.pubDate ?? candidate.createdAt
    const baseDateMs = baseDate.getTime()
    return {
      candidate,
      score: calcPopularityScore(candidate, nowMs, baseDateMs),
      baseDateMs,
    }
  })

  ranked.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    if (a.baseDateMs !== b.baseDateMs) return b.baseDateMs - a.baseDateMs
    return b.candidate.id - a.candidate.id
  })

  return ranked.map(entry => entry.candidate)
}

function orderArticlesByIds<T extends { id: number }>(articles: T[], ids: number[]): T[] {
  const map = new Map(articles.map(article => [article.id, article]))
  return ids.map(id => map.get(id)).filter(Boolean) as T[]
}

function buildPreferenceProfile(signals: WeightedSignal[], interestVector: number[] | null): PreferenceProfile {
  const rawFeedWeights = new Map<number, number>()
  const rawRecentFeedWeights = new Map<number, number>()
  const rawContentTypeWeights: Record<ContentKind, number> = {
    article: 0,
    image: 0,
    video: 0,
  }
  const rawRecentContentTypeWeights: Record<ContentKind, number> = {
    article: 0,
    image: 0,
    video: 0,
  }

  for (const [index, signal] of signals.entries()) {
    const weight = getBehaviorWeight(signal.score, signal.createdAt)
    if (weight <= 0) continue

    rawFeedWeights.set(signal.feedId, (rawFeedWeights.get(signal.feedId) ?? 0) + weight)
    rawContentTypeWeights[signal.contentType] += weight

    if (index < RECENT_SIGNAL_WINDOW) {
      const recentDecay = 1 - (index / RECENT_SIGNAL_WINDOW) * 0.7
      const recentWeight = weight * (1.4 + recentDecay)
      rawRecentFeedWeights.set(signal.feedId, (rawRecentFeedWeights.get(signal.feedId) ?? 0) + recentWeight)
      rawRecentContentTypeWeights[signal.contentType] += recentWeight
    }
  }

  return {
    interestVector,
    feedWeights: normalizeWeightMap(rawFeedWeights),
    recentFeedWeights: normalizeWeightMap(rawRecentFeedWeights),
    contentTypeWeights: normalizeContentTypeWeights(rawContentTypeWeights),
    recentContentTypeWeights: normalizeContentTypeWeights(rawRecentContentTypeWeights),
  }
}

function scoreRecommendationCandidate(
  candidate: RecommendationCandidate,
  profile: PreferenceProfile,
  popularityScore: number,
) {
  const semanticScore = candidate.contentType === 'article' && profile.interestVector && candidate.embedding?.length === INTEREST_DIMENSIONS
    ? cosineSimilarity(profile.interestVector, candidate.embedding)
    : 0
  const feedScore = profile.feedWeights.get(candidate.feedId) ?? 0
  const recentFeedScore = profile.recentFeedWeights.get(candidate.feedId) ?? 0
  const typeScore = profile.contentTypeWeights[candidate.contentType] ?? 0
  const recentTypeScore = profile.recentContentTypeWeights[candidate.contentType] ?? 0
  const isMedia = candidate.contentType !== 'article'

  if (isMedia) {
    return (
      (semanticScore * MEDIA_SEMANTIC_WEIGHT) +
      (feedScore * MEDIA_FEED_WEIGHT) +
      (typeScore * MEDIA_TYPE_WEIGHT) +
      (recentFeedScore * MEDIA_RECENT_FEED_WEIGHT) +
      (recentTypeScore * MEDIA_RECENT_TYPE_WEIGHT) +
      (popularityScore * MEDIA_POPULARITY_WEIGHT)
    )
  }

  return (
    (semanticScore * ARTICLE_SEMANTIC_WEIGHT) +
    (feedScore * ARTICLE_FEED_WEIGHT) +
    (typeScore * ARTICLE_TYPE_WEIGHT) +
    (recentFeedScore * ARTICLE_RECENT_FEED_WEIGHT) +
    (recentTypeScore * ARTICLE_RECENT_TYPE_WEIGHT) +
    (popularityScore * ARTICLE_POPULARITY_WEIGHT)
  )
}

function rankRecommendationCandidates(candidates: RecommendationCandidate[], profile: PreferenceProfile) {
  const nowMs = Date.now()
  const rawPopularity = candidates.map((candidate) => {
    const baseDate = candidate.pubDate ?? candidate.createdAt
    return calcPopularityScore(candidate, nowMs, baseDate.getTime())
  })
  const maxPopularity = Math.max(0, ...rawPopularity)

  const ranked: RankedRecommendationCandidate[] = candidates.map((candidate, index) => {
    const popularityScore = maxPopularity > 0 ? rawPopularity[index]! / maxPopularity : 0
    const baseDateMs = (candidate.pubDate ?? candidate.createdAt).getTime()
    const baseScore = scoreRecommendationCandidate(candidate, profile, popularityScore)
    const randomJitter = (Math.random() - 0.5) * RANKING_RANDOM_JITTER

    return {
      candidate,
      baseDateMs,
      score: baseScore + randomJitter,
    }
  })

  ranked.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    if (a.baseDateMs !== b.baseDateMs) return b.baseDateMs - a.baseDateMs
    return b.candidate.id - a.candidate.id
  })

  return ranked
}

function calcDiversityPenalty(
  entry: RankedRecommendationCandidate,
  selected: RankedRecommendationCandidate[],
  feedCounts: Map<number, number>,
  typeCounts: Record<ContentKind, number>,
) {
  let penalty = 0
  const recent = selected.slice(-DIVERSITY_LOOKBACK)

  for (const recentEntry of recent) {
    if (recentEntry.candidate.feedId === entry.candidate.feedId) {
      penalty += SAME_FEED_RECENT_PENALTY
    }

    if (recentEntry.candidate.contentType === entry.candidate.contentType) {
      penalty += SAME_TYPE_RECENT_PENALTY
    }
  }

  penalty += (feedCounts.get(entry.candidate.feedId) ?? 0) * SAME_FEED_REPEAT_PENALTY
  penalty += typeCounts[entry.candidate.contentType] * SAME_TYPE_REPEAT_PENALTY

  return penalty
}

function pickDiversifiedCandidateIndex(
  remaining: RankedRecommendationCandidate[],
  selected: RankedRecommendationCandidate[],
  feedCounts: Map<number, number>,
  typeCounts: Record<ContentKind, number>,
) {
  const scored = remaining
    .map((entry, index) => ({
      index,
      adjustedScore: entry.score - calcDiversityPenalty(entry, selected, feedCounts, typeCounts),
    }))
    .sort((a, b) => b.adjustedScore - a.adjustedScore)

  const pool = scored.slice(0, Math.min(DIVERSITY_RANDOM_POOL_SIZE, scored.length))
  const minScore = Math.min(...pool.map(item => item.adjustedScore))
  const weights = pool.map(item => Math.max(0.001, item.adjustedScore - minScore + 0.01))
  const totalWeight = weights.reduce((sum, value) => sum + value, 0)
  let random = Math.random() * totalWeight

  for (let index = 0; index < pool.length; index++) {
    random -= weights[index]!
    if (random <= 0) {
      return pool[index]!.index
    }
  }

  return pool[0]!.index
}

function diversifyRecommendationCandidates(
  ranked: RankedRecommendationCandidate[],
  limit: number,
) {
  const remaining = [...ranked.slice(0, Math.min(ranked.length, limit * DIVERSIFIED_CANDIDATE_MULTIPLIER))]
  const selected: RankedRecommendationCandidate[] = []
  const feedCounts = new Map<number, number>()
  const typeCounts: Record<ContentKind, number> = {
    article: 0,
    image: 0,
    video: 0,
  }

  while (remaining.length > 0 && selected.length < limit) {
    const bestIndex = pickDiversifiedCandidateIndex(remaining, selected, feedCounts, typeCounts)

    const [picked] = remaining.splice(bestIndex, 1)
    if (!picked) break

    selected.push(picked)
    feedCounts.set(picked.candidate.feedId, (feedCounts.get(picked.candidate.feedId) ?? 0) + 1)
    typeCounts[picked.candidate.contentType] += 1
  }

  if (selected.length < limit) {
    for (const entry of ranked) {
      if (selected.length >= limit) break
      if (selected.some(item => item.candidate.id === entry.candidate.id)) continue
      selected.push(entry)
    }
  }

  return selected.map(entry => entry.candidate)
}

export async function listPopularArticles(offset: number, limit: number, contentType?: ContentKind) {
  const candidates = await articleRepo.listPopularityCandidates([], contentType)
  const orderedIds = rankPopularityCandidates(candidates)
    .slice(offset, offset + limit)
    .map(candidate => candidate.id)

  if (orderedIds.length === 0) return []

  const articles = await articleRepo.listByIds(orderedIds, contentType)
  return orderArticlesByIds(articles, orderedIds)
}

export async function listFallbackForRecommendation(excludedIds: number[], limit: number, contentType?: ContentKind) {
  const candidates = await articleRepo.listPopularityCandidates(excludedIds, contentType)
  return rankPopularityCandidates(candidates)
    .slice(0, limit)
    .map(candidate => candidate.id)
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
  const rows = await behaviorRepo.listWeightedSignals(userId, MAX_BEHAVIORS)

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
      vector[index]! += embedding[index]! * weight
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

export async function seedUserRecommendations(userId: string, contentType?: ContentKind) {
  const interest = await interestRepo.findByUser(userId)
  const seenArticleIds = await behaviorRepo.listSeenArticleIds(userId)
  const signals = await behaviorRepo.listWeightedSignals(userId, MAX_BEHAVIORS)
  const interestVector = interest?.interestVector?.length ? interest.interestVector : null

  if (signals.length === 0 && !interestVector) {
    return []
  }

  const profile = buildPreferenceProfile(signals, interestVector)
  const candidates = await articleRepo.listRecommendationCandidates(
    seenArticleIds,
    MAX_RECOMMENDATION_CANDIDATES,
    contentType,
  )
  const candidateIds = diversifyRecommendationCandidates(
    rankRecommendationCandidates(candidates, profile),
    MAX_RECOMMENDATIONS,
  )
    .map(candidate => candidate.id)

  const fallbackIds = candidateIds.length < MAX_RECOMMENDATIONS
    ? await listFallbackForRecommendation(
      [...seenArticleIds, ...candidateIds],
      MAX_RECOMMENDATIONS - candidateIds.length,
      contentType,
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
