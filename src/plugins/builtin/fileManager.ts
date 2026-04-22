import { readdirSync, readFileSync, existsSync, renameSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { homedir } from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
import { BasePlugin, PluginCommand } from '../base'

export default class FileManagerPlugin extends BasePlugin {
  readonly name = 'file-manager'
  readonly description = 'Gestión de archivos y carpetas'

  readonly commands: PluginCommand[] = [
    {
      pattern: /listá?\s+(?:archivos\s+(?:de|en)\s+)?(.+)/i,
      description: 'Listar archivos de un directorio',
      handler: async (text, match) => {
        const dir = this.resolvePath(match?.[1]?.trim() || '~')
        if (!existsSync(dir)) return `No existe el directorio: ${dir}`
        const files = readdirSync(dir)
        if (!files.length) return 'El directorio está vacío.'
        return `Archivos en ${dir}:\n${files.slice(0, 15).join(', ')}${files.length > 15 ? ` y ${files.length - 15} más` : ''}`
      },
    },
    {
      pattern: /leé?\s+(?:el\s+archivo\s+)?(.+\.\w+)/i,
      description: 'Leer contenido de archivo',
      handler: async (text, match) => {
        const file = this.resolvePath(match?.[1]?.trim() || '')
        if (!existsSync(file)) return `No encontré el archivo: ${file}`
        const content = readFileSync(file, 'utf8')
        return content.slice(0, 500) + (content.length > 500 ? '... [truncado]' : '')
      },
    },
    {
      pattern: /creá?\s+(?:la\s+)?carpeta\s+(.+)/i,
      description: 'Crear carpeta',
      handler: async (text, match) => {
        const dir = this.resolvePath(match?.[1]?.trim() || '')
        mkdirSync(dir, { recursive: true })
        return `Carpeta creada: ${dir}`
      },
    },
    {
      pattern: /buscá?\s+(?:el\s+archivo\s+)?(.+)/i,
      description: 'Buscar archivo',
      handler: async (text, match) => {
        const name = match?.[1]?.trim() || ''
        try {
          const { stdout } = await execAsync(`find ~ -name "*${name}*" -maxdepth 5 2>/dev/null | head -10`, {
            encoding: 'utf8', timeout: 5000
          })
          const result = stdout.trim()
          return result || `No encontré archivos con "${name}"`
        } catch {
          return `No pude buscar "${name}"`
        }
      },
    },
  ]

  private resolvePath(p: string): string {
    return p.replace(/^~/, homedir()).replace(/^desktop/i, join(homedir(), 'Desktop'))
  }
}
