import cron from 'node-cron'
import { fetchAllFeeds } from './fetcher'

let running = false

async function runRssFetch() {
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

// 启动后立即跑一次
void runRssFetch()

// 定时跑（15分钟）
cron.schedule('*/15 * * * *', () => {
  void runRssFetch()
})
