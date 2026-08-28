import { createServer } from 'node:http'

import { startWorkflowWorker } from '@/lib/workflow/worker'

const worker = startWorkflowWorker()

const port = Number(process.env.PORT) || 3000
const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('ok')
})
server.listen(port, () => {
  console.log(`[worker] health endpoint listening on port ${port}`)
})

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
  server.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
