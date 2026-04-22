import { BasePlugin, PluginCommand } from '../base'
import { getConfig } from '../../core/config'
import { getLogger } from '../../core/logger'

const log = getLogger('whatsapp-plugin')

export default class WhatsAppPlugin extends BasePlugin {
  readonly name = 'whatsapp'
  readonly description = 'Integración con WhatsApp Web via Selenium'
  private enabled: boolean

  constructor() {
    super()
    this.enabled = getConfig().getOrDefault(false, 'integrations', 'whatsapp', 'enabled')
  }

  readonly commands: PluginCommand[] = [
    {
      pattern: /(?:mandá|enviá|manda|envia)\s+(?:un\s+)?(?:mensaje|whatsapp)\s+a\s+(.+?)\s+(?:diciendo|que\s+diga)\s+(.+)/i,
      description: 'Enviar mensaje de WhatsApp',
      handler: async (text, match) => {
        if (!this.enabled) return 'WhatsApp no está habilitado. Activalo en config.yaml.'
        const contact = match?.[1]?.trim()
        const message = match?.[2]?.trim()
        if (!contact || !message) return 'No entendí el contacto o el mensaje.'
        return await this.sendMessage(contact, message)
      },
    },
    {
      pattern: ['mis mensajes de whatsapp', 'mensajes nuevos', 'leer whatsapp'],
      description: 'Leer mensajes de WhatsApp',
      handler: async () => {
        if (!this.enabled) return 'WhatsApp no está habilitado. Activalo en config.yaml.'
        return await this.readMessages()
      },
    },
  ]

  private async sendMessage(contact: string, message: string): Promise<string> {
    log.info({ contact, message }, 'Sending WhatsApp message')
    try {
      const python = `
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time, urllib.parse

msg = urllib.parse.quote("${message.replace(/"/g, '\\"')}")
url = f"https://web.whatsapp.com/send?phone=${contact.replace(/\D/g, '')}&text={msg}"
opts = webdriver.ChromeOptions()
opts.add_argument("--user-data-dir=/tmp/jarvis_whatsapp")
driver = webdriver.Chrome(options=opts)
driver.get(url)
time.sleep(5)
btn = WebDriverWait(driver, 15).until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'button[data-tab="11"]')))
btn.click()
time.sleep(1)
driver.quit()
print('ok')
`
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)
      await execAsync(`python3 -c "${python.replace(/\n/g, '; ')}"`, { timeout: 30000 })
      return `Mensaje enviado a ${contact}.`
    } catch (err) {
      log.error({ err }, 'WhatsApp send error')
      return `No pude enviar el mensaje: ${(err as Error).message}`
    }
  }

  private async readMessages(): Promise<string> {
    return 'Para leer mensajes, abrí WhatsApp Web en el navegador. La función de lectura automática requiere configuración adicional.'
  }

  async onLoad() {
    if (this.enabled) {
      log.info('WhatsApp plugin loaded (enabled)')
    }
  }
}
