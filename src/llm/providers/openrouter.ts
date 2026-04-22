import { OpenAIProvider } from './openai'

export class OpenRouterProvider extends OpenAIProvider {
  readonly name = 'openrouter'

  constructor(apiKey: string, model = 'meta-llama/llama-3.2-3b-instruct:free') {
    super(apiKey, model, 'https://openrouter.ai/api/v1')
  }
}
