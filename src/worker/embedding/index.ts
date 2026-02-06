import cron from 'node-cron'
import { generateEmbedding } from './generator'

let running = false

async function runEmbeddingGenerate() {
  if (running) {
    console.log('[Embedding] previous job still running, skip')
    return
  }

  running = true
  console.log('[Embedding] generate start')

  try {
    await generateEmbedding()
    console.log('[Embedding] generate done')
  } catch (err) {
    console.error('[Embedding] generate failed', err)
  } finally {
    running = false
  }
}

void runEmbeddingGenerate()

// 定时任务：每小时处理未嵌入的文章
cron.schedule('0 * * * *', () => {
  void runEmbeddingGenerate()
})