export const formatDate = (value: Date | string | number | null) => {
  if (!value) {
    return '未知时间'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '未知时间'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const formatRelativeTime = (value: Date | string | number | null) => {
  if (!value) {
    return '未知时间'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '未知时间'
  }

  const diffMs = Date.now() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 60) {
    return '刚刚'
  }

  if (diffSeconds < 60 * 60) {
    return `${Math.floor(diffSeconds / 60)} 分钟前`
  }

  if (diffSeconds < 60 * 60 * 24) {
    return `${Math.floor(diffSeconds / (60 * 60))} 小时前`
  }

  if (diffSeconds < 60 * 60 * 24 * 7) {
    return `${Math.floor(diffSeconds / (60 * 60 * 24))} 天前`
  }

  if (diffSeconds < 60 * 60 * 24 * 30) {
    return `${Math.floor(diffSeconds / (60 * 60 * 24 * 7))} 周前`
  }

  return formatDate(date)
}

export const formatRecentTime = (value: Date | string | number | null) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffMs = Date.now() - date.getTime()
  const recentThresholdMs = 1000 * 60 * 60 * 24 * 30

  if (diffMs <= recentThresholdMs && diffMs >= 0) {
    return formatRelativeTime(date)
  }

  return formatDate(date)
}
