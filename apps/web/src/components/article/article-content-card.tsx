import type { JSX } from 'react'

import ReactMarkdown, { type ExtraProps, type Options } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

import { cn } from '@/lib/utils'

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
  iframe: ({ node: _node, className, ...props }: JSX.IntrinsicElements['iframe'] & ExtraProps) => {
    return (
      <div className="my-6 aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        <iframe {...props} className={cn('h-full w-full', className)} />
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
