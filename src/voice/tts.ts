import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { tmpdir } from 'os'
import { unlinkSync, existsSync } from 'fs'
import { getConfig } from '../core/config'
import { getLogger } from '../core/logger'

const execAsync = promisify(exec)

const log = getLogger('tts')

export class TTSEngine {
  private config = getConfig()
  private engine: string
  private voice: string
  private edgeVoice: string

  constructor() {
    this.engine = this.config.getOrDefault('say', 'voice', 'tts', 'engine')
    this.voice = this.config.getOrDefault('Paulina', 'voice', 'tts', 'voice')
    this.edgeVoice = this.config.getOrDefault('es-AR-ElenaNeural', 'voice', 'tts', 'edgeTtsVoice')
  }

  async speak(text: string): Promise<void> {
    log.debug({ engine: this.engine, preview: text.slice(0, 50) }, 'Speaking')
    try {
      switch (this.engine) {
        case 'edge-tts':
          await this.speakEdgeTts(text)
          break
        case 'pyttsx3':
          await this.speakPyttsx3(text)
          break
        default:
          await this.speakSay(text)
      }
    } catch (err) {
      log.error({ err }, 'TTS error')
    }
  }

  private async speakSay(text: string): Promise<void> {
    const safe = text.replace(/'/g, "'\\''")
    const { platform } = require('os')
    const os = platform()
    if (os === 'darwin') {
      try { await execAsync(`say -v "${this.voice}" '${safe}'`, { timeout: 30000 }) } catch {}
      return
    }
    // Linux / Windows fallback chain
    const cmds = [
      `espeak-ng -v es -s 150 '${safe}' 2>/dev/null`,
      `espeak -v es -s 150 '${safe}' 2>/dev/null`,
      `festival --tts <<< '${safe}'`,
    ]
    for (const cmd of cmds) {
      try {
        await execAsync(cmd, { timeout: 30000, shell: '/bin/bash' })
        return
      } catch {}
    }
    log.warn('No TTS engine found (espeak-ng, espeak, festival)')
  }

  private async speakEdgeTts(text: string): Promise<void> {
    const tmpFile = join(tmpdir(), `jarvis_tts_${Date.now()}.mp3`)
    try {
      await execAsync(`edge-tts --voice "${this.edgeVoice}" --text "${text.replace(/"/g, '\\"')}" --write-media "${tmpFile}"`, {
        timeout: 15000,
      })
      if (existsSync(tmpFile)) {
        await execAsync(`mpg123 -q "${tmpFile}" 2>/dev/null || ffplay -nodisp -autoexit "${tmpFile}" 2>/dev/null`, {
          timeout: 60000,
        }).catch(() => {})
        try { unlinkSync(tmpFile) } catch {}
      }
    } catch (err) {
      log.warn('edge-tts failed, falling back to say')
      await this.speakSay(text)
    }
  }

  private async speakPyttsx3(text: string): Promise<void> {
    const python = `
import pyttsx3
e = pyttsx3.init()
e.say("""${text.replace(/"/g, '\\"')}""")
e.runAndWait()
`
    try { await execAsync(`python3 -c "${python.replace(/\n/g, '; ')}"`, { timeout: 30000 }) } catch {}
  }
}
