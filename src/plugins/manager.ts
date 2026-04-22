import { readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { BasePlugin } from './base'
import { getLogger } from '../core/logger'

const log = getLogger('plugins')

export class PluginManager {
  private _plugins: BasePlugin[] = []

  async loadAll() {
    const builtinDir = join(__dirname, 'builtin')
    if (!existsSync(builtinDir)) return
    const files = readdirSync(builtinDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    for (const file of files) {
      try {
        const mod = require(join(builtinDir, file))
        const PluginClass = mod.default || Object.values(mod)[0]
        if (typeof PluginClass === 'function') {
          const plugin = new PluginClass() as BasePlugin
          await plugin.onLoad()
          this._plugins.push(plugin)
          log.info({ plugin: plugin.name }, 'Plugin loaded')
        }
      } catch (err) {
        log.error({ err, file }, 'Plugin load error')
      }
    }
  }

  register(plugin: BasePlugin) {
    this._plugins.push(plugin)
    log.info({ plugin: plugin.name }, 'Plugin registered')
  }

  async execute(text: string): Promise<string | null> {
    for (const plugin of this._plugins) {
      const hit = plugin.matches(text)
      if (hit) {
        log.info({ plugin: plugin.name, text }, 'Plugin matched')
        try {
          const result = await hit.command.handler(text, hit.match)
          return result
        } catch (err) {
          log.error({ err, plugin: plugin.name }, 'Plugin execution error')
          return `Error en plugin ${plugin.name}`
        }
      }
    }
    return null
  }

  get plugins() { return this._plugins }
  get count() { return this._plugins.length }
}
