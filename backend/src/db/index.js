/**
 * db/index.js — PostgreSQL connection pool (node-postgres).
 *
 * All database queries go through this pool.
 * Uses a single Pool instance for the lifetime of the process.
 *
 * Provides:
 *  - pool          : the pg Pool instance (for queries)
 *  - checkHealth() : resolves true when the DB is reachable
 *  - disconnect()  : gracefully ends the pool (used during shutdown)
 */
import pg from 'pg'
import { URL } from 'node:url'
import { config } from '../config/index.js'
import logger from '../utils/logger.js'

const { Pool, Client } = pg

function getPoolOptions() {
  if (process.env.CLOUDFLARE_HYPERDRIVE === 'true') {
    const connectionString = globalThis.__HYPERDRIVE_CONNECTION_STRING
    if (!connectionString) {
      throw new Error('Hyperdrive connection is only available inside a Cloudflare request handler.')
    }
    return { connectionString }
  }

  if (config.db.url) {
    try {
      const u = new URL(config.db.url)
      const isRemote = u.hostname.includes('supabase') || process.env.NODE_ENV === 'production'
      return {
        host: u.hostname,
        port: parseInt(u.port || '5432', 10),
        database: u.pathname.replace(/^\//, '') || 'postgres',
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        ssl: isRemote ? { rejectUnauthorized: false } : false,
      }
    } catch {
      return {
        connectionString: config.db.url,
        ssl: { rejectUnauthorized: false },
      }
    }
  }

  const isRemote = config.db.host !== 'localhost' && config.db.host !== '127.0.0.1'
  return {
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    ssl: isRemote ? { rejectUnauthorized: false } : false,
  }
}

const isCloudflareWorker = process.env.CLOUDFLARE_HYPERDRIVE === 'true'
let nodePool

function getNodePool() {
  if (!nodePool) {
    nodePool = new Pool({
      ...getPoolOptions(),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })

    nodePool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle PostgreSQL client')
    })
  }
  return nodePool
}

async function withWorkerClient(callback) {
  const client = new Client({
    ...getPoolOptions(),
    connectionTimeoutMillis: 5_000,
  })

  await client.connect()
  try {
    return await callback(client)
  } finally {
    await client.end()
  }
}

const pool = {
  query(...args) {
    return isCloudflareWorker
      ? withWorkerClient((client) => client.query(...args))
      : getNodePool().query(...args)
  },
  async connect() {
    if (!isCloudflareWorker) return getNodePool().connect()

    const client = new Client({
      ...getPoolOptions(),
      connectionTimeoutMillis: 5_000,
    })
    await client.connect()
    client.release = () => client.end()
    return client
  },
  on(event, listener) {
    if (!isCloudflareWorker) getNodePool().on(event, listener)
    return this
  },
  async end() {
    if (nodePool) await nodePool.end()
  },
}

/**
 * Verify the database connection is alive by running a trivial query.
 *
 * @returns {Promise<boolean>} true when connected, false otherwise
 */
export async function checkHealth() {
  const client = await pool.connect().catch(() => null)
  if (!client) return false
  try {
    await client.query('SELECT 1')
    return true
  } catch {
    return false
  } finally {
    client.release()
  }
}

/**
 * Gracefully close all connections in the pool.
 * Call this during server shutdown.
 */
export async function disconnect() {
  await pool.end()
  logger.info('PostgreSQL pool closed')
}

export default pool
