import { generateEmbedding } from './generator'

let running = false

export async function runEmbeddingGenerate() {
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
