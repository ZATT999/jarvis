import { getConfig } from '../core/config'
import { getLogger } from '../core/logger'
import { BaseProvider } from './base'
import { OllamaProvider } from './providers/ollama'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { GroqProvider } from './providers/groq'
import { OpenRouterProvider } from './providers/openrouter'
import type { ChatMessage } from '../core/memory'

const log = getLogger('llm-manager')

export class ProviderManager {
  private providers: Map<string, BaseProvider> = new Map()
  private active: BaseProvider

  constructor() {
    const cfg = getConfig()
    this.providers.set('ollama', new OllamaProvider(
      cfg.getOrDefault('http://localhost:11434', 'providers', 'ollama', 'baseUrl'),
      cfg.getOrDefault('llama3.1:8b', 'providers', 'ollama', 'model')
    ))
    this.providers.set('openai', new OpenAIProvider(
      cfg.getOrDefault('', 'providers', 'openai', 'apiKey'),
      cfg.getOrDefault('gpt-4o-mini', 'providers', 'openai', 'model')
    ))
    this.providers.set('anthropic', new AnthropicProvider(
      cfg.getOrDefault('', 'providers', 'anthropic', 'apiKey'),
      cfg.getOrDefault('claude-sonnet-4-6', 'providers', 'anthropic', 'model')
    ))
    this.providers.set('groq', new GroqProvider(
      cfg.getOrDefault('', 'providers', 'groq', 'apiKey'),
      cfg.getOrDefault('llama-3.3-70b-versatile', 'providers', 'groq', 'model')
    ))
    this.providers.set('openrouter', new OpenRouterProvider(
      cfg.getOrDefault('', 'providers', 'openrouter', 'apiKey'),
      cfg.getOrDefault('meta-llama/llama-3.2-3b-instruct:free', 'providers', 'openrouter', 'model')
    ))

    const name = cfg.getOrDefault('ollama', 'llm', 'provider')
    this.active = this.providers.get(name) ?? this.providers.get('ollama')!
    log.info({ provider: this.active.name }, 'LLM provider active')
  }

  switch(name: string) {
    const p = this.providers.get(name)
    if (!p) throw new Error(`Unknown provider: ${name}`)
    this.active = p
    getConfig().set('llm', 'provider', name)
    log.info({ provider: name }, 'Provider switched')
  }

  async chat(messages: ChatMessage[], system?: string): Promise<string> {
    const cfg = getConfig()
    const temperature = cfg.getOrDefault(0.7, 'llm', 'temperature')
    const maxTokens = cfg.getOrDefault(1024, 'llm', 'maxTokens')
    return this.active.chat(messages, system, temperature, maxTokens)
  }

  get current() { return this.active.name }
  get available() { return [...this.providers.keys()] }
}
