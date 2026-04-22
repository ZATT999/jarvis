import { spawn, ChildProcess } from 'child_process'
import { getConfig } from '../core/config'
import { getLogger } from '../core/logger'
import recorder from 'node-record-lpcm16'

const log = getLogger('wake-word')

export class WakeWordDetector {
  private config = getConfig()
  private onDetected: () => void
  private running = false
  private recorderStream: ReturnType<typeof recorder.record> | null = null
  private wakeWord: string
  private engine: string

  constructor(onDetected: () => void) {
    this.onDetected = onDetected
    this.wakeWord = this.config.getOrDefault('zatt', 'jarvis', 'wakeWord').toLowerCase()
    this.engine = this.config.getOrDefault('simple', 'voice', 'wakeWord', 'engine')
  }

  start() {
    this.running = true
    log.info({ engine: this.engine, wakeWord: this.wakeWord }, 'Wake word detector started')
    if (this.engine === 'porcupine') {
      this.startPorcupine()
    } else {
      this.startSimple()
    }
  }

  stop() {
    this.running = false
    this.recorderStream?.stop()
    log.info('Wake word detector stopped')
  }

  private startSimple() {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    const doListen = async () => {
      if (!this.running) return
      try {
        const python = `
import speech_recognition as sr
import sys
r = sr.Recognizer()
r.energy_threshold = 300
r.dynamic_energy_threshold = True
with sr.Microphone() as source:
    r.adjust_for_ambient_noise(source, duration=0.5)
    try:
        audio = r.listen(source, timeout=3, phrase_time_limit=2)
        text = r.recognize_google(audio, language='es-AR').lower()
        print(text)
    except:
        print('')
`
        const { stdout } = await execAsync(`python3 -c "${python.replace(/"/g, '\\"')}"`, {
          timeout: 10000,
          encoding: 'utf8',
        })
        const result = stdout.trim()

        if (result.includes(this.wakeWord)) {
          log.info({ detected: result }, 'Wake word matched')
          this.onDetected()
        }
      } catch (_) {
        // Silencio o error, continuamos
      }
      // Delay entre intentos para no saturar CPU
      if (this.running) setTimeout(doListen, 500)
    }
    doListen()
  }

  private startPorcupine() {
    log.warn('Porcupine engine not configured, falling back to simple')
    this.engine = 'simple'
    this.startSimple()
  }
}
