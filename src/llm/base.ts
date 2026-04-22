import type { ChatMessage } from '../core/memory'

export abstract class BaseProvider {
  abstract readonly name: string

  abstract chat(
    messages: ChatMessage[],
    system?: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<string>

  isAvailable(): boolean {
    return true
  }
}
