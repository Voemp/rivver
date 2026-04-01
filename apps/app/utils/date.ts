export const formatDate = (value: Date | string | number | null) => {
  if (!value) return '未知时间'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知时间'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const formatRelativeTime = (value: Date | string | number | null) => {
  if (!value) return '未知时间'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知时间'
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSeconds < 60) return '刚刚'
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} 分钟前`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} 小时前`
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} 天前`
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 604800)} 周前`
  return formatDate(date)
}

export const formatRecentTime = (value: Date | string | number | null) => {
  if (!value) return '未知时间'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知时间'
  const diffMs = Date.now() - date.getTime()
  if (diffMs <= 2592000000 && diffMs >= 0) return formatRelativeTime(date)
  return formatDate(date)
}
