import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import * as yaml from 'js-yaml'
import * as dotenv from 'dotenv'

dotenv.config()

const BASE_DIR = join(__dirname, '..', '..')
const DEFAULT_CONFIG = join(BASE_DIR, 'config', 'default.yaml')
const USER_CONFIG = join(BASE_DIR, 'config', 'config.yaml')

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

function deepMerge<T extends object>(base: T, override: DeepPartial<T>): T {
  const result = { ...base }
  for (const key in override) {
    const val = override[key]
    if (val && typeof val === 'object' && !Array.isArray(val) && key in base && typeof base[key] === 'object') {
      ;(result as Record<string, unknown>)[key] = deepMerge(base[key] as object, val as object)
    } else if (val !== undefined) {
      ;(result as Record<string, unknown>)[key] = val
    }
  }
  return result
}

class Config {
  private data: Record<string, unknown> = {}

  constructor() {
    this.load()
  }

  private load() {
    if (existsSync(DEFAULT_CONFIG)) {
      this.data = yaml.load(readFileSync(DEFAULT_CONFIG, 'utf8')) as Record<string, unknown> || {}
    }
    if (existsSync(USER_CONFIG)) {
      const user = yaml.load(readFileSync(USER_CONFIG, 'utf8')) as Record<string, unknown> || {}
      this.data = deepMerge(this.data, user)
    }
    this.injectEnv()
  }

  private injectEnv() {
    const envMap: Record<string, string[]> = {
      OPENAI_API_KEY: ['providers', 'openai', 'apiKey'],
      ANTHROPIC_API_KEY: ['providers', 'anthropic', 'apiKey'],
      GROQ_API_KEY: ['providers', 'groq', 'apiKey'],
      OPENROUTER_API_KEY: ['providers', 'openrouter', 'apiKey'],
    }
    for (const [envKey, path] of Object.entries(envMap)) {
      const val = process.env[envKey]
      if (val) this.set(...path, val)
    }
  }

  get<T = unknown>(...keys: string[]): T | undefined {
    let node: unknown = this.data
    for (const key of keys) {
      if (typeof node !== 'object' || node === null || !(key in node)) return undefined
      node = (node as Record<string, unknown>)[key]
    }
    return node as T
  }

  getOrDefault<T>(defaultValue: T, ...keys: string[]): T {
    return (this.get<T>(...keys) ?? defaultValue) as T
  }

  set(...keysAndValue: unknown[]) {
    const value = keysAndValue[keysAndValue.length - 1]
    const keys = keysAndValue.slice(0, -1) as string[]
    let node = this.data as Record<string, unknown>
    for (const key of keys.slice(0, -1)) {
      if (!(key in node) || typeof node[key] !== 'object') node[key] = {}
      node = node[key] as Record<string, unknown>
    }
    node[keys[keys.length - 1]] = value
    this.saveUserConfig()
  }

  private saveUserConfig() {
    try {
      writeFileSync(USER_CONFIG, yaml.dump(this.data), 'utf8')
    } catch (err) {
      // Packaged builds install into a read-only location; keep the change in memory only.
      console.warn(`[config] could not persist ${USER_CONFIG}: ${(err as Error).message}`)
    }
  }

  reload() {
    this.data = {}
    this.load()
  }
}

let instance: Config | null = null
export function getConfig(): Config {
  if (!instance) instance = new Config()
  return instance
}
