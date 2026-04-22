import { exec, execSync } from 'child_process'
import { promisify } from 'util'
import { platform } from 'os'
import { BasePlugin, PluginCommand } from '../base'

const execAsync = promisify(exec)
const OS = platform()

export default class SystemControlPlugin extends BasePlugin {
  readonly name = 'system-control'
  readonly description = 'Controla aplicaciones y el sistema operativo'

  readonly commands: PluginCommand[] = [
    {
      pattern: /abrí?\s+(.+)/i,
      description: 'Abrir aplicación',
      handler: async (text, match) => {
        const app = match?.[1]?.trim()
        if (!app) return 'No entendí qué querés abrir.'
        await this.openApp(app)
        return `Abriendo ${app}.`
      },
    },
    {
      pattern: /cerrá?\s+(.+)/i,
      description: 'Cerrar aplicación',
      handler: async (text, match) => {
        const app = match?.[1]?.trim()
        if (!app) return 'No entendí qué querés cerrar.'
        await this.killApp(app)
        return `Cerré ${app}.`
      },
    },
    {
      pattern: ['qué hora es', 'que hora es', 'hora actual'],
      description: 'Ver hora actual',
      handler: async () => {
        const now = new Date()
        return `Son las ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}.`
      },
    },
    {
      pattern: ['qué día es', 'que dia es', 'fecha de hoy'],
      description: 'Ver fecha actual',
      handler: async () => {
        const now = new Date()
        return `Hoy es ${now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
      },
    },
    {
      pattern: /ejecut[aá]\s+(.+)/i,
      description: 'Ejecutar comando',
      handler: async (text, match) => {
        const cmd = match?.[1]?.trim()
        if (!cmd) return 'Decime qué comando querés ejecutar.'
        try {
          const { stdout } = await execAsync(cmd, { timeout: 10000 })
          return stdout.trim() || 'Comando ejecutado.'
        } catch (err: unknown) {
          return `Error: ${(err as Error).message}`
        }
      },
    },
    {
      pattern: ['apagar la computadora', 'apagá la pc', 'shutdown'],
      description: 'Apagar el sistema',
      handler: async () => {
        await execAsync(OS === 'darwin' ? 'sudo shutdown -h now' : 'sudo shutdown -h now')
        return 'Apagando el sistema...'
      },
    },
    {
      pattern: ['reiniciar', 'reboot', 'reiniciá la pc'],
      description: 'Reiniciar el sistema',
      handler: async () => {
        await execAsync(OS === 'darwin' ? 'sudo reboot' : 'sudo reboot')
        return 'Reiniciando...'
      },
    },
    {
      pattern: /volumen\s+(\d+)/i,
      description: 'Ajustar volumen',
      handler: async (text, match) => {
        const level = parseInt(match?.[1] || '50')
        await this.setVolume(level)
        return `Volumen ajustado a ${level}%.`
      },
    },
    {
      pattern: ['silencio', 'mutear', 'silenciá'],
      description: 'Mutear audio',
      handler: async () => {
        await this.setVolume(0)
        return 'Audio silenciado.'
      },
    },
  ]

  private async openApp(appName: string) {
    const cmds: Record<string, string> = {
      darwin: `open -a "${appName}" 2>/dev/null || open "${appName}" 2>/dev/null`,
      linux: `xdg-open "${appName}" 2>/dev/null || "${appName}" &`,
      win32: `start "" "${appName}"`,
    }
    await execAsync(cmds[OS] || cmds.linux)
  }

  private async killApp(appName: string) {
    const cmds: Record<string, string> = {
      darwin: `pkill -i "${appName}" 2>/dev/null || osascript -e 'quit app "${appName}"'`,
      linux: `pkill -i "${appName}"`,
      win32: `taskkill /IM "${appName}.exe" /F`,
    }
    await execAsync(cmds[OS] || cmds.linux)
  }

  private async setVolume(level: number) {
    const cmds: Record<string, string> = {
      darwin: `osascript -e "set volume output volume ${level}"`,
      linux: `amixer -D pulse sset Master ${level}%`,
      win32: `nircmd.exe setsysvolume ${Math.round(level * 655.35)}`,
    }
    await execAsync(cmds[OS] || cmds.linux)
  }
}
