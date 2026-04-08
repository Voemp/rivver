import { HomeArticleCard, type HomeArticleItem } from '@/components/home/home-article-card.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

// --- 1. 定义配置类型 ---
type FeaturedVariant = 'feature' | 'stack' | 'aside'

interface ColumnConfig {
  indices: number[]    // 对应 items 数组中的索引
  variant: FeaturedVariant
  rows: number
}

// --- 2. 静态布局配置 (解耦核心) ---
const LAYOUT_CONFIGS = {
  lg: [
    { indices: [0, 1], variant: 'stack', rows: 2 },
    { indices: [2], variant: 'feature', rows: 1 },
    { indices: [3, 4, 5, 6, 7], variant: 'aside', rows: 5 },
  ] as ColumnConfig[],
  sm: [
    { indices: [0], variant: 'feature', rows: 1 },
    { indices: [1, 2], variant: 'stack', rows: 2 },
  ] as ColumnConfig[],
}

// --- 3. 基础原子组件 ---
const FeaturedLink = ({ article, variant }: { article: HomeArticleItem; variant: FeaturedVariant }) => (
  <Link
    to="/article/$id"
    params={{ id: article.id }}
    className="group block h-full min-h-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
  >
    <HomeArticleCard article={article} variant={variant} />
  </Link>
)

// --- 4. 抽象后的列渲染组件 ---
const FeaturedColumn = ({ items, config }: { items: HomeArticleItem[]; config: ColumnConfig }) => {
  const { indices, variant, rows } = config

  return (
    <div className="flex min-h-0 flex-col">
      {indices.map((dataIndex, i) => {
        const item = items[dataIndex]
        const isLast = i === indices.length - 1

        return (
          <Fragment key={dataIndex}>
            <div className="min-h-0 flex-1">
              {item ? <FeaturedLink article={item} variant={variant} /> : <div className="h-full" />}
            </div>
            {!isLast && <Separator className={rows === 5 ? 'my-1.5' : 'my-2'} />}
          </Fragment>
        )
      })}
    </div>
  )
}

// --- 5. 主组件 ---
export const HomeFeaturedSection = ({ items }: { items: HomeArticleItem[] }) => {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Home Featured</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">精选内容</h1>
      </header>

      {/* LG 布局 */}
      <div className="hidden lg:grid lg:h-180 lg:grid-cols-[1fr_1.24fr_1fr] lg:gap-x-16 relative">
        {LAYOUT_CONFIGS.lg.map((conf, i) => (
          <Fragment key={i}>
            <FeaturedColumn items={items} config={conf} />
            {i < LAYOUT_CONFIGS.lg.length - 1 && (
              <Separator orientation="vertical" className="absolute"
                         style={{
                           left: i === 0
                             ? `calc((100% / (1 + 1.24 + 1)) * 1)`
                             : `calc((100% / (1 + 1.24 + 1)) * 2.24)`,
                         }}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* SM 布局 */}
      <div className="hidden sm:grid sm:h-168 sm:grid-cols-[1.2fr_1fr] sm:gap-x-8 relative lg:hidden">
        {LAYOUT_CONFIGS.sm.map((conf, i) => (
          <Fragment key={i}>
            <FeaturedColumn items={items} config={conf} />
            {i < LAYOUT_CONFIGS.sm.length - 1 && (
              <Separator orientation="vertical" className="absolute"
                         style={{ left: 'calc((100% / (1.2 + 1)) * 1.2)' }}
              />
            )}
          </Fragment>
        ))}
      </div>
    </section>
  )
}

// --- 6. 骨架屏列组件 (与业务组件逻辑对称) ---
const FeaturedColumnSkeleton = ({ config }: { config: ColumnConfig }) => {
  const { indices, rows } = config

  return (
    <div className="flex h-full min-h-0 flex-col">
      {indices.map((_, i) => {
        const isLast = i === indices.length - 1
        return (
          <Fragment key={i}>
            <div className="min-h-0 flex-1">
              <Skeleton className="h-full w-full rounded-none" />
            </div>
            {/* 这里的间距逻辑与 FeaturedColumn 保持完全一致 */}
            {!isLast && <div className={rows === 5 ? 'my-1.5' : 'my-2'} />}
          </Fragment>
        )
      })}
    </div>
  )
}

// --- 7. 骨架屏主组件 ---
export const HomeFeaturedSectionSkeleton = () => {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-3 w-16 rounded-none" />
        <Skeleton className="h-9 w-40 rounded-none" />
      </header>

      {/* 使用相同的 LAYOUT_CONFIGS 渲染 XL 骨架 */}
      <div className="hidden lg:grid lg:h-180 lg:grid-cols-[1fr_1.24fr_1fr] lg:gap-8">
        {LAYOUT_CONFIGS.lg.map((conf, i) => (
          <FeaturedColumnSkeleton key={`xl-skel-${i}`} config={conf} />
        ))}
      </div>

      {/* 使用相同的 LAYOUT_CONFIGS 渲染 LG 骨架 */}
      <div className="hidden sm:grid sm:h-168 sm:grid-cols-[1.2fr_1fr] sm:gap-8 lg:hidden">
        {LAYOUT_CONFIGS.sm.map((conf, i) => (
          <FeaturedColumnSkeleton key={`lg-skel-${i}`} config={conf} />
        ))}
      </div>
    </section>
  )
}
