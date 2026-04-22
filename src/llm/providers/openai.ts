import { BaseProvider } from '../base'
import type { ChatMessage } from '../../core/memory'

export class OpenAIProvider extends BaseProvider {
  readonly name: string = 'openai'

  constructor(
    protected apiKey: string,
    protected model = 'gpt-4o-mini',
    protected baseURL = 'https://api.openai.com/v1'
  ) {
    super()
  }

  protected client() {
    const { OpenAI } = require('openai')
    return new OpenAI({ apiKey: this.apiKey, baseURL: this.baseURL })
  }

  async chat(messages: ChatMessage[], system = '', temperature = 0.7, maxTokens = 1024): Promise<string> {
    const full = system ? [{ role: 'system', content: system }, ...messages] : messages
    const resp = await this.client().chat.completions.create({
      model: this.model,
      messages: full,
      temperature,
      max_tokens: maxTokens,
    })
    return resp.choices[0].message.content as string
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }
}
