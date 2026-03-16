import { Skeleton } from '@/components/ui/skeleton.tsx'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

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

type ArticleContentCardProps = {
  content: string
}

export const ArticleContentCard = ({ content }: ArticleContentCardProps) => {
  return (
    <section className="mx-auto mt-10 max-w-3xl">
      <div
        className="text-[1.04rem] leading-8 text-foreground [&_.contains-task-list]:list-none [&_.contains-task-list]:pl-0 [&_.task-list-item]:list-none [&_.task-list-item]:pl-0 [&_.task-list-item>input]:mr-3 [&_.task-list-item>input]:accent-primary [&>div>*:first-child]:mt-0 [&>div>*:last-child]:mb-0">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, [rehypeSanitize, customSchema]]}
          components={{
            h1: ({ node: _node, ...props }) => (
              <h1
                className="mt-16 mb-6 scroll-mt-28 text-3xl font-semibold leading-tight tracking-[-0.03em] text-foreground text-balance" {...props} />
            ),
            h2: ({ node: _node, ...props }) => (
              <h2
                className="mt-14 mb-5 scroll-mt-28 border-t border-border/60 pt-6 text-2xl font-semibold leading-tight tracking-[-0.03em] text-foreground text-balance" {...props} />
            ),
            h3: ({ node: _node, ...props }) => (
              <h3
                className="mt-10 mb-4 scroll-mt-28 text-xl font-semibold leading-snug tracking-tight text-foreground" {...props} />
            ),
            h4: ({ node: _node, ...props }) => (
              <h4 className="mt-8 mb-3 scroll-mt-28 text-lg font-semibold leading-snug text-foreground/90" {...props} />
            ),
            p: ({ node: _node, ...props }) => (
              <p className="my-6 text-[1.04rem] leading-8 text-foreground/92" {...props} />
            ),
            a: ({ node: _node, ...props }) => (
              <a
                className="font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/80" {...props} />
            ),
            ul: ({ node: _node, ...props }) => (
              <ul className="my-6 list-disc space-y-3 pl-6 marker:text-primary/85" {...props} />
            ),
            ol: ({ node: _node, ...props }) => (
              <ol className="my-6 list-decimal space-y-3 pl-6 marker:font-semibold marker:text-primary/85" {...props} />
            ),
            li: ({ node: _node, ...props }) => <li className="pl-1 text-foreground/90" {...props} />,
            blockquote: ({ node: _node, ...props }) => (
              <blockquote className="my-8 border-l-2 border-primary/70 pl-5 text-foreground/72 italic" {...props} />
            ),
            code: ({ node: _node, className, children, ...props }) => {
              const isBlock = Boolean(className)

              if (isBlock) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <code
                  className="rounded-sm bg-accent/60 px-1.5 py-0.5 font-mono text-[0.9em] text-accent-foreground" {...props}>
                  {children}
                </code>
              )
            },
            pre: ({ node: _node, ...props }) => (
              <pre
                className="my-8 overflow-x-auto border border-border/70 bg-background/75 px-4 py-4 text-sm text-foreground" {...props} />
            ),
            hr: ({ node: _node, ...props }) => <hr className="my-10 border-border/60" {...props} />,
            img: ({ node: _node, ...props }) => (
              <img className="my-8 border border-border/60 bg-muted/20" {...props} />
            ),
            table: ({ node: _node, ...props }) => (
              <div className="my-8 overflow-x-auto border border-border/70 bg-background/70">
                <table className="w-full text-left text-sm" {...props} />
              </div>
            ),
            thead: ({ node: _node, ...props }) => <thead className="bg-muted/40" {...props} />,
            th: ({ node: _node, ...props }) => (
              <th className="border-b border-border/60 px-4 py-3 align-top font-medium text-foreground" {...props} />
            ),
            td: ({ node: _node, ...props }) => (
              <td className="border-b border-border/50 px-4 py-3 align-top text-foreground/82" {...props} />
            ),
            strong: ({ node: _node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
            em: ({ node: _node, ...props }) => <em className="text-foreground/80" {...props} />,
            iframe: ({ node, ...props }) => (
              <div className="aspect-video w-full my-6 overflow-hidden rounded-xl border bg-muted shadow-sm">
                <iframe {...props} className="h-full w-full" />
              </div>
            ),
          }}
        >
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
              <Skeleton key={`${blockIndex}-${lineIndex}`} className={`h-4 ${width} rounded-none`} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}