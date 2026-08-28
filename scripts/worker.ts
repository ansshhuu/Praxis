import { startWorkflowWorker } from '@/lib/workflow/worker'

const worker = startWorkflowWorker()

worker.on('completed', (job) => {
  console.log(`[worker] job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err)
})

console.log('[worker] workflow worker started')

async function shutdown() {
  console.log('[worker] shutting down')
  await worker.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
