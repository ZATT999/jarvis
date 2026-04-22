import { EventEmitter } from 'events'

export const Events = {
  WAKE_WORD_DETECTED: 'wake_word.detected',
  LISTENING_START: 'voice.listening.start',
  LISTENING_STOP: 'voice.listening.stop',
  SPEECH_RECOGNIZED: 'voice.speech.recognized',
  LLM_RESPONSE_START: 'llm.response.start',
  LLM_RESPONSE_CHUNK: 'llm.response.chunk',
  LLM_RESPONSE_DONE: 'llm.response.done',
  TTS_START: 'tts.start',
  TTS_DONE: 'tts.done',
  PLUGIN_EXECUTED: 'plugin.executed',
  SYSTEM_READY: 'system.ready',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  UI_STATUS: 'ui.status',
  UI_UPDATE: 'ui.update',
  ERROR: 'error',
} as const

export type JarvisEvent = (typeof Events)[keyof typeof Events]

class EventBus extends EventEmitter {
  emit(event: string, data?: unknown): boolean {
    return super.emit(event, data)
  }

  on(event: string, listener: (data: unknown) => void): this {
    return super.on(event, listener)
  }
}

const bus = new EventBus()
bus.setMaxListeners(50)

export function getEventBus(): EventBus {
  return bus
}
