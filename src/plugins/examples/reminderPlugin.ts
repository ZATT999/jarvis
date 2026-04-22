/**
 * Ejemplo de plugin personalizado: recordatorios
 *
 * Para activar:
 * 1. Copiá este archivo a src/plugins/builtin/
 * 2. Reiniciá Jarvis
 *
 * Comandos:
 *   "Jarvis, recordame llamar al médico en 5 minutos"
 *   "Jarvis, mostrar recordatorios"
 */
import { BasePlugin, PluginCommand } from '../base'

interface Reminder {
  text: string
  triggerAt: number
}

export default class ReminderPlugin extends BasePlugin {
  readonly name = 'reminders'
  readonly description = 'Sistema de recordatorios por voz'
  private reminders: Reminder[] = []

  readonly commands: PluginCommand[] = [
    {
      pattern: /recordame\s+(.+?)\s+en\s+(\d+)\s+(minuto|hora|segundo)s?/i,
      description: 'Crear recordatorio',
      handler: async (text, match) => {
        const what = match?.[1]?.trim() || 'algo'
        const amount = parseInt(match?.[2] || '5')
        const unit = match?.[3]?.toLowerCase() || 'minuto'
        const ms = unit.startsWith('seg') ? amount * 1000
                 : unit.startsWith('hora') ? amount * 3600000
                 : amount * 60000

        const triggerAt = Date.now() + ms
        this.reminders.push({ text: what, triggerAt })

        setTimeout(() => {
          console.log(`\n🔔 RECORDATORIO: ${what}`)
          // En producción, emit al bus para que Jarvis lo diga en voz alta
        }, ms)

        return `Listo, te recuerdo "${what}" en ${amount} ${unit}${amount > 1 ? 's' : ''}.`
      },
    },
    {
      pattern: ['mostrar recordatorios', 'mis recordatorios', 'qué recordatorios tengo'],
      description: 'Ver recordatorios pendientes',
      handler: async () => {
        const pending = this.reminders.filter(r => r.triggerAt > Date.now())
        if (!pending.length) return 'No tenés recordatorios pendientes.'
        return pending
          .map(r => {
            const mins = Math.round((r.triggerAt - Date.now()) / 60000)
            return `• "${r.text}" en ${mins} minuto${mins !== 1 ? 's' : ''}`
          })
          .join('\n')
      },
    },
  ]
}
