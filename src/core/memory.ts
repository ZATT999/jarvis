// Simple in-memory chat history (no SQLite needed)
import { getConfig } from './config'
import { getLogger } from './logger'

const log = getLogger('memory')

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export class MemoryManager {
  private messages: ChatMessage[] = []
  private maxHistory: number
  private contextWindow: number

  constructor() {
    const cfg = getConfig()
    this.maxHistory = cfg.getOrDefault(20, 'memory', 'maxHistory')
    this.contextWindow = cfg.getOrDefault(10, 'memory', 'contextWindow')
    log.info('Memory manager initialized (in-memory)')
  }

  add(role: ChatMessage['role'], content: string) {
    this.messages.push({ role, content })
    if (this.messages.length > this.maxHistory) {
      this.messages = this.messages.slice(-this.maxHistory)
    }
    log.debug({ role, preview: content.slice(0, 30) }, 'message saved')
  }

  getContext(): ChatMessage[] {
    return this.messages.slice(-this.contextWindow)
  }

  getHistory(limit = 50) {
    return this.messages.slice(-limit).map(m => ({
      ...m,
      timestamp: new Date().toISOString()
    }))
  }

  clearSession() {
    this.messages = []
  }
}