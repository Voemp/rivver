import { Skeleton } from '@/components/ui/skeleton.tsx'
import { cn } from '@/lib/utils'
import ReactMarkdown, { type Options } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

type ArticleContentCardProps = {
  content: string
  className?: string
  contentClassName?: string
}

const customSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'iframe', // 允许使用 iframe 标签
  ],
  attributes: {
    ...defaultSchema.attributes,
    // 允许 iframe 拥有以下属性
    iframe: [
      'src',
      'width',
      'height',
      'title',
      'frameborder',
      'allow',
      'allowfullscreen',
      'className',
    ],
  },
}

const markdownRehypePlugins: Options['rehypePlugins'] = [rehypeRaw, [rehypeSanitize, customSchema]]

const markdownComponents: Options['components'] = {
  iframe: ({ node: _node, className, ...props }: any) => {
    return (
      <div className="my-6 aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        <iframe {...props} className={`h-full w-full ${className ?? ''}`} />
      </div>
    )
  },
}

export const ArticleContentCard = ({
  content,
  className,
  contentClassName,
}: ArticleContentCardProps) => {
  return (
    <section className={cn('mx-auto mt-10 max-w-3xl', className)}>
      <div className={cn('typeset', contentClassName)}>
        <ReactMarkdown rehypePlugins={markdownRehypePlugins} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </section>
  )
}

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
          <div key={blockIndex} className="space-y-3">
            {block.heading ? <Skeleton className={`h-5 ${block.heading} rounded-none`} /> : null}
            {block.lines.map((width, lineIndex) => (
              <Skeleton
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
