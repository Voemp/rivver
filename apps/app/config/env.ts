const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export const env = {
  apiBaseUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  ),
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'Rivver RSS',
  articleListPageSize: Number(process.env.EXPO_PUBLIC_PAGE_SIZE ?? 12),
}
