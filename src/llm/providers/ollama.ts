import axios from 'axios'
import { BaseProvider } from '../base'
import type { ChatMessage } from '../../core/memory'

export class OllamaProvider extends BaseProvider {
  readonly name = 'ollama'

  constructor(
    private baseUrl = 'http://localhost:11434',
    private model = 'llama3.2:3b'
  ) {
    super()
  }

  async chat(messages: ChatMessage[], system = '', temperature = 0.7, maxTokens = 1024): Promise<string> {
    const fullMessages = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages

    const { data } = await axios.post(
      `${this.baseUrl}/api/chat`,
      { model: this.model, messages: fullMessages, stream: false, options: { temperature, num_predict: maxTokens } },
      { timeout: 60000 }
    )
    return data.message.content as string
  }

  isAvailable(): boolean {
    return !!this.baseUrl
  }
}
