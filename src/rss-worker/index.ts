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

// 启动后立即跑一次（很重要）
runRssFetch().then(() => {
})

// 每 15 分钟跑一次
cron.schedule('*/15 * * * *', () => {
  runRssFetch().then(() => {
  })
})
