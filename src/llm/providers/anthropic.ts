import { BaseProvider } from '../base'
import type { ChatMessage } from '../../core/memory'

export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic'

  constructor(
    private apiKey: string,
    private model = 'claude-sonnet-4-6'
  ) {
    super()
  }

  async chat(messages: ChatMessage[], system = '', temperature = 0.7, maxTokens = 1024): Promise<string> {
    const Anthropic = require('@anthropic-ai/sdk')
    const client = new Anthropic.default({ apiKey: this.apiKey })
    const resp = await client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      temperature,
      system: system || undefined,
      messages,
    })
    return resp.content[0].text as string
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }
}
