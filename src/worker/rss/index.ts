import { fetchAllFeeds } from './fetcher'

let running = false

export async function runRssFetch() {
  if (running) {
    console.log('[RSS] previous job still running, skip')
    return
  }

  running = true
  console.log('[RSS] fetch start')

  try {
    await fetchAllFeeds()
    console.log('[RSS] fetch done')
  } catch (err) {
    console.error('[RSS] fetch failed', err)
  } finally {
    running = false
  }
}
