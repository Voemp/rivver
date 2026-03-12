const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const env = {
  apiBaseUrl: trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'),
  appName: import.meta.env.VITE_APP_NAME ?? 'Rivver RSS',
  articleListPageSize: Number(import.meta.env.VITE_RECOMMENDATION_PAGE_SIZE ?? 12),
}
