import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { getConfig } from '../core/config'
import { getLogger } from '../core/logger'

const execAsync = promisify(exec)

const log = getLogger('stt')

export class STTEngine {
  private config = getConfig()
  private engine: string
  private language: string

  constructor() {
    this.engine = this.config.getOrDefault('groq', 'voice', 'stt', 'engine')
    this.language = this.config.getOrDefault('es', 'voice', 'stt', 'language')
  }

  async listen(): Promise<string | null> {
    log.info('Listening...')
    try {
      if (this.engine === 'whisper' || this.engine === 'groq') {
        return await this.listenWhisper()
      }
      return await this.listenGoogle()
    } catch (err) {
      log.error({ err }, 'STT error')
      return null
    }
  }

  private async listenGoogle(): Promise<string | null> {
    const python = `
import speech_recognition as sr
r = sr.Recognizer()
r.energy_threshold = 400
r.dynamic_energy_threshold = True
with sr.Microphone() as source:
    r.adjust_for_ambient_noise(source, duration=0.5)
    try:
        audio = r.listen(source, timeout=5, phrase_time_limit=10)
        text = r.recognize_google(audio, language='${this.language}-AR')
        print(text)
    except sr.WaitTimeoutError:
        print('')
    except sr.UnknownValueError:
        print('')
    except Exception as e:
        print('')
`
    try {
      const { stdout } = await execAsync(`python3 -c "${python.replace(/"/g, '\\"')}"`, {
        timeout: 20000,
        encoding: 'utf8',
      })
      return stdout.trim() || null
    } catch {
      return null
    }
  }

  private async listenWhisper(): Promise<string | null> {
    const tmpFile = join(tmpdir(), `jarvis_audio_${Date.now()}.wav`)
    const python = `
import speech_recognition as sr
r = sr.Recognizer()
r.energy_threshold = 400
r.dynamic_energy_threshold = True
with sr.Microphone() as source:
    r.adjust_for_ambient_noise(source, duration=0.5)
    try:
        audio = r.listen(source, timeout=5, phrase_time_limit=10)
        with open('${tmpFile}', 'wb') as f:
            f.write(audio.get_wav_data())
        print('ok')
    except:
        print('error')
`
    try {
      await execAsync(`python3 -c "${python.replace(/"/g, '\\"')}"`, {
        timeout: 20000,
        encoding: 'utf8',
      })

      if (!existsSync(tmpFile)) {
        log.warn('No audio recorded')
        return null
      }

      // Try Groq Whisper first (free), fallback to OpenAI
      const groqKey = this.config.getOrDefault('', 'providers', 'groq', 'apiKey')
      if (groqKey) {
        try {
          const result = await this.transcribeGroq(tmpFile, groqKey)
          return result
        } catch {
          const openaiKey = this.config.getOrDefault('', 'providers', 'openai', 'apiKey')
          if (openaiKey) {
            try { return await this.transcribeOpenAI(tmpFile, openaiKey) } catch { return null }
          }
          return null
        }
      } else {
        const openaiKey = this.config.getOrDefault('', 'providers', 'openai', 'apiKey')
        if (openaiKey) {
          try { return await this.transcribeOpenAI(tmpFile, openaiKey) } catch { return null }
        } else {
          log.warn('No API key for Whisper')
          return null
        }
      }
    } catch (err) {
      log.error({ err }, 'Recording failed')
      return null
    }
  }

  private async transcribeGroq(filePath: string, apiKey: string): Promise<string | null> {
    const { default: axios } = require('axios')
    const FormData = require('form-data')
    const fs = require('fs')

    const form = new FormData()
    form.append('file', fs.createReadStream(filePath))
    form.append('model', 'whisper')
    form.append('language', this.language)

    const { data } = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${apiKey}` },
      timeout: 30000,
    })

    try { unlinkSync(filePath) } catch {}

    return data.text || null
  }

  private async transcribeOpenAI(filePath: string, apiKey: string): Promise<string | null> {
    const { OpenAI } = require('openai')
    const { createReadStream } = require('fs')
    const openai = new OpenAI({ apiKey })

    const { text } = await openai.audio.transcriptions.create({
      file: createReadStream(filePath),
      model: 'whisper-1',
      language: this.language,
    })

    try { unlinkSync(filePath) } catch {}

    return text
  }
}
