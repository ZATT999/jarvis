export interface PluginCommand {
  pattern: RegExp | string[]
  description: string
  handler: (text: string, match: RegExpMatchArray | null) => Promise<string>
}

export abstract class BasePlugin {
  abstract readonly name: string
  abstract readonly description: string
  abstract readonly commands: PluginCommand[]

  async onLoad(): Promise<void> {}
  async onUnload(): Promise<void> {}

  matches(text: string): { command: PluginCommand; match: RegExpMatchArray | null } | null {
    const lower = text.toLowerCase()
    for (const cmd of this.commands) {
      if (cmd.pattern instanceof RegExp) {
        const m = lower.match(cmd.pattern)
        if (m) return { command: cmd, match: m }
      } else if (Array.isArray(cmd.pattern)) {
        const found = cmd.pattern.some(kw => lower.includes(kw.toLowerCase()))
        if (found) return { command: cmd, match: null }
      }
    }
    return null
  }
}
