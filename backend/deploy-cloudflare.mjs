import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const backendDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(backendDirectory, '..')
const frontendDirectory = path.join(projectDirectory, 'frontend')
const isWindows = process.platform === 'win32'

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWindows,
  })

  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status ?? 'unknown'}`)
}

const envFile = path.join(backendDirectory, '.env')
const localEnv = dotenv.parse(readFileSync(envFile))
const secretNames = [
  'JWT_SECRET',
  'CHAPA_SECRET_KEY',
  'CHAPA_WEBHOOK_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
]

const missing = secretNames.filter((name) => !localEnv[name])
if (missing.length) {
  throw new Error(`Missing required deployment settings: ${missing.join(', ')}`)
}

const secretsFile = path.join(tmpdir(), `gebetapro-secrets-${randomUUID()}.json`)

try {
  writeFileSync(
    secretsFile,
    JSON.stringify(Object.fromEntries(secretNames.map((name) => [name, localEnv[name]]))),
    { mode: 0o600 },
  )

  run(isWindows ? 'npm.cmd' : 'npm', ['run', 'build'], frontendDirectory)
  run(
    isWindows ? 'npx.cmd' : 'npx',
    ['--yes', 'wrangler', 'deploy', '--secrets-file', secretsFile],
    backendDirectory,
  )
} finally {
  try {
    unlinkSync(secretsFile)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}
