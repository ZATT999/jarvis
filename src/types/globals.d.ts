// node:sqlite (Node.js 22.5+)
declare module 'node:sqlite' {
  interface StatementSync {
    run(...params: unknown[]): { lastInsertRowid: number; changes: number }
    get(...params: unknown[]): unknown
    all(...params: unknown[]): unknown[]
  }
  export class DatabaseSync {
    constructor(location: string, options?: { open?: boolean })
    exec(sql: string): void
    prepare(sql: string): StatementSync
    close(): void
  }
}

// node-record-lpcm16
declare module 'node-record-lpcm16' {
  interface RecordOptions {
    sampleRate?: number
    channels?: number
    compress?: boolean
    threshold?: number
    silence?: string
    recorder?: string
    endOnSilence?: boolean
    audioType?: string
  }
  interface Recording {
    stream(): NodeJS.ReadableStream
    stop(): void
    pause(): void
    resume(): void
  }
  export function record(options?: RecordOptions): Recording
}
