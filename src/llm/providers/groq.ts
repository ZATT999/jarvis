import { BaseProvider } from '../base'
import type { ChatMessage } from '../../core/memory'

export class GroqProvider extends BaseProvider {
  readonly name = 'groq'

  constructor(
    private apiKey: string,
    private model = 'llama-3.3-70b-versatile'
  ) {
    super()
  }

  async chat(messages: ChatMessage[], system = '', temperature = 0.7, maxTokens = 1024): Promise<string> {
    const Groq = require('groq-sdk')
    const client = new Groq.default({ apiKey: this.apiKey })
    const full = system ? [{ role: 'system', content: system }, ...messages] : messages
    const resp = await client.chat.completions.create({
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
