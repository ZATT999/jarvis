import { getConfig } from './config'
import { getEventBus, Events } from './eventBus'
import { getLogger } from './logger'
import { MemoryManager } from './memory'
import { ProviderManager } from '../llm/manager'
import { TTSEngine } from '../voice/tts'
import { STTEngine } from '../voice/stt'
import { WakeWordDetector } from '../voice/wakeWord'
import { PluginManager } from '../plugins/manager'

const log = getLogger('assistant')

export class Assistant {
  private config = getConfig()
  private bus = getEventBus()
  private memory = new MemoryManager()
  private llm: ProviderManager
  private tts: TTSEngine
  private stt: STTEngine
  private wakeWord: WakeWordDetector
  private plugins: PluginManager
  private running = false

  constructor() {
    this.llm = new ProviderManager()
    this.tts = new TTSEngine()
    this.stt = new STTEngine()
    this.plugins = new PluginManager()
    this.wakeWord = new WakeWordDetector(() => this.onWakeWord())
  }

  async start(opts: { voice?: boolean } = {}) {
    const voice = opts.voice ?? true
    log.info('Starting Zatt...')
    await this.plugins.loadAll()
    log.info(`Plugins loaded: ${this.plugins.count}`)
    this.running = true
    this.bus.emit(Events.SYSTEM_READY)
    if (voice) {
      try {
        await this.speak('Zatt en línea. ¿En qué puedo ayudarte?')
      } catch (e) {
        log.error({ err: String(e) }, 'TTS failed during startup')
      }
      this.wakeWord.start()
    }
    log.info('Zatt ready')
  }

  async stop() {
    this.running = false
    this.wakeWord.stop()
    this.bus.emit(Events.SYSTEM_SHUTDOWN)
    log.info('Jarvis stopped')
  }

  private onWakeWord() {
    log.info('Wake word detected!')
    this.bus.emit(Events.WAKE_WORD_DETECTED)
    setImmediate(() => this.handleListen())
  }

  private async handleListen() {
    // Pausar wake word para liberar micrófono
    this.wakeWord.stop()
    this.bus.emit(Events.UI_STATUS, { status: 'listening' })
    const text = await this.stt.listen()
    // Reanudar wake word
    this.wakeWord.start()
    if (!text) {
      this.bus.emit(Events.UI_STATUS, { status: 'idle' })
      return
    }
    log.info(`Speech recognized: ${text}`)
    this.bus.emit(Events.SPEECH_RECOGNIZED, { text })
    await this.process(text)
  }

  async process(text: string): Promise<string> {
    this.bus.emit(Events.UI_STATUS, { status: 'thinking' })

    const pluginResult = await this.plugins.execute(text)
    if (pluginResult !== null) {
      await this.speak(pluginResult)
      this.bus.emit(Events.UI_STATUS, { status: 'idle' })
      return pluginResult
    }

    this.memory.add('user', text)
    const context = this.memory.getContext()
    const system = this.config.getOrDefault(
      'Eres Jarvis, un asistente personal avanzado.',
      'llm', 'systemPrompt'
    )

    this.bus.emit(Events.LLM_RESPONSE_START)
    let response = ''
    try {
      response = await this.llm.chat(context, system)
    } catch (err) {
      log.error(`LLM error: ${(err as Error).message}`)
      response = 'Lo siento, tuve un error al procesar tu solicitud.'
    }

    this.memory.add('assistant', response)
    this.bus.emit(Events.LLM_RESPONSE_DONE, { text: response })
    await this.speak(response)
    this.bus.emit(Events.UI_STATUS, { status: 'idle' })
    return response
  }

  private async speak(text: string) {
    this.bus.emit(Events.TTS_START, { text })
    await this.tts.speak(text)
    this.bus.emit(Events.TTS_DONE)
  }

  // Public method to listen - called from UI via IPC
  async listen(): Promise<string> {
    this.wakeWord.stop()
    this.bus.emit(Events.UI_STATUS, { status: 'listening' })
    const text = await this.stt.listen()
    this.wakeWord.start()
    if (!text) {
      this.bus.emit(Events.UI_STATUS, { status: 'idle' })
      return ''
    }
    log.info(`Speech recognized: ${text}`)
    this.bus.emit(Events.SPEECH_RECOGNIZED, { text })
    return text
  }

  get isRunning() {
    return this.running
  }
}
