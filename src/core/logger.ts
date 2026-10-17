import pino from 'pino'
import { join } from 'path'
import { homedir } from 'os'
import { mkdirSync } from 'fs'

// Prefer ./logs (dev/CLI); fall back to ~/.jarvis/logs when the cwd is not writable
// (e.g. packaged builds launched from "/" or a read-only install directory).
function resolveLogDir(): string {
  for (const dir of [join(process.cwd(), 'logs'), join(homedir(), '.jarvis', 'logs')]) {
    try {
      mkdirSync(dir, { recursive: true })
      return dir
    } catch {
      // try next candidate
    }
  }
  return join(homedir(), '.jarvis', 'logs')
}

const logDir = resolveLogDir()

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      level: process.env.LOG_LEVEL || 'info',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
    {
      target: 'pino/file',
      level: 'debug',
      options: { destination: join(logDir, 'jarvis.log'), mkdir: true },
    },
  ],
})

export const logger = pino(
  { level: process.env.LOG_LEVEL || 'info' },
  transport
)

export function getLogger(namespace: string) {
  return logger.child({ namespace })
}
