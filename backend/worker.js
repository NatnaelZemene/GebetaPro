import { handleAsNodeRequest } from 'cloudflare:node'
import app from './src/app.js'
import { runExpiryJob } from './src/modules/subscriptions/subscriptions.expiry.js'
import logger from './src/utils/logger.js'

const port = Number(process.env.PORT || 3000)
app.listen(port)

export default {
  fetch(request, workerEnv) {
    // Access Hyperdrive only while handling a request; Cloudflare does not
    // permit opening its connection binding during global module startup.
    globalThis.__HYPERDRIVE_CONNECTION_STRING = workerEnv.HYPERDRIVE.connectionString
    return handleAsNodeRequest(port, request)
  },

  scheduled(_controller, workerEnv, context) {
    globalThis.__HYPERDRIVE_CONNECTION_STRING = workerEnv.HYPERDRIVE.connectionString
    context.waitUntil(
      runExpiryJob().catch((error) => {
        logger.error({ err: error }, 'Scheduled subscription expiry sweep failed')
      }),
    )
  },
}
