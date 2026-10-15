import { Skeleton } from '@/components/ui/skeleton.tsx'

export const ArticleContentSkeleton = () => {
  const blocks = [
    { heading: 'w-1/2', lines: ['w-full', 'w-11/12', 'w-5/6', 'w-4/5'] },
    { heading: null, lines: ['w-full', 'w-10/12', 'w-4/5', 'w-2/3'] },
    { heading: 'w-2/5', lines: ['w-full', 'w-11/12', 'w-5/6'] },
  ]

  return (
    <section className="mx-auto mt-10 max-w-3xl">
      <div className="space-y-10">
        {blocks.map((block, blockIndex) => (
          // oxlint-disable-next-line react/no-array-index-key -- 静态骨架屏项
          <div key={blockIndex} className="space-y-3">
            {block.heading ? <Skeleton className={`h-5 ${block.heading} rounded-none`} /> : null}
            {block.lines.map((width, lineIndex) => (
              <Skeleton
                // oxlint-disable-next-line react/no-array-index-key -- 静态骨架屏项
                key={`${blockIndex}-${lineIndex}`}
                className={`h-4 ${width} rounded-none`}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
