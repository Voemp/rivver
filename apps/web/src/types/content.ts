export const contentTypeOptions = ['article', 'image', 'video'] as const
export type ContentType = typeof contentTypeOptions[number]

export const contentTypeLabels: Record<ContentType, string> = {
  article: '文章',
  image: '图片',
  video: '视频',
}
