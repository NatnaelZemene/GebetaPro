import { env } from 'cloudflare:workers'
import { handleAsNodeRequest } from 'cloudflare:node'

// Cloudflare bindings are available at the Worker entry point. Copy string
// bindings into process.env before importing the Express app, whose config is
// read during module initialization.
for (const [key, value] of Object.entries(env)) {
  if (typeof value === 'string') process.env[key] = value
}

process.env.CLOUDFLARE_WORKER = 'true'
process.env.CLOUDFLARE_HYPERDRIVE = 'true'
process.env.DATABASE_URL = env.HYPERDRIVE.connectionString

const [{ default: app }, { runExpiryJob }, { default: logger }] = await Promise.all([
  import('./src/app.js'),
  import('./src/modules/subscriptions/subscriptions.cron.js'),
  import('./src/utils/logger.js'),
])

const port = Number(process.env.PORT || 3000)
app.listen(port)

export default {
  fetch(request) {
    return handleAsNodeRequest(port, request)
  },

  scheduled(_controller, _workerEnv, context) {
    context.waitUntil(
      runExpiryJob().catch((error) => {
        logger.error({ err: error }, 'Scheduled subscription expiry sweep failed')
      }),
    )
  },
}
