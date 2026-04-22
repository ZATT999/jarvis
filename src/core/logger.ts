import pino from 'pino'
import { join } from 'path'
import { mkdirSync } from 'fs'

const logDir = join(process.cwd(), 'logs')
mkdirSync(logDir, { recursive: true })

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
