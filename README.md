# Jarvis — Asistente de IA Personal

Asistente de inteligencia artificial personal avanzado, ejecutado localmente con interfaz flotante, activación por voz y soporte para múltiples proveedores de LLM.

## Descargas

Descarga el instalador para tu sistema desde la [última versión](https://github.com/ZATT999/jarvis/releases/latest).

| Sistema | Archivo |
|---------|---------|
| Windows 10/11 (x64) | `Jarvis-1.0.0-windows-x64-setup.exe` |
| Linux (cualquier distribución) | `Jarvis-1.0.0-linux-x86_64.AppImage` |
| Debian / Ubuntu | `Jarvis-1.0.0-linux-amd64.deb` |

> **Nota:** los instaladores no están firmados digitalmente.
> - **Windows:** si SmartScreen bloquea el instalador, pulsa **Más información → Ejecutar de todas formas**.
> - **Linux (AppImage):** dale permiso de ejecución antes de abrirlo: `chmod +x Jarvis-1.0.0-linux-x86_64.AppImage`.
>
> macOS no está disponible por ahora.

## Instalación rápida

```bash
cd jarvis
bash install.sh
```

## Uso

```bash
# Con GUI flotante (requiere entorno de escritorio)
npm start

# Solo CLI (texto, sin voz ni GUI)
npm run cli

# Desarrollo (hot reload)
npm run dev
```

## Proveedores de LLM

Edita `config/config.yaml`:

```yaml
llm:
  provider: "ollama"   # ollama | openai | anthropic | groq | openrouter
```

| Proveedor   | Configuración                         |
|-------------|---------------------------------------|
| Ollama      | Instalar Ollama + `ollama pull llama3.2:3b` |
| OpenAI      | `OPENAI_API_KEY` en `.env`            |
| Anthropic   | `ANTHROPIC_API_KEY` en `.env`         |
| Groq        | `GROQ_API_KEY` en `.env`              |
| OpenRouter  | `OPENROUTER_API_KEY` en `.env`        |

## Comandos de voz

Los plugins integrados reconocen frases como las siguientes. Los patrones están definidos en `src/plugins/builtin/` y aceptan las formas verbales exactas de la tabla (por ejemplo, `abrí`, `cerrá`, `buscá`, `listá`); cualquier otra frase se envía al LLM.

| Frase                                 | Acción                    |
|---------------------------------------|---------------------------|
| "Jarvis, abrí Firefox"                | Abre Firefox              |
| "Jarvis, qué hora es"                 | Dice la hora              |
| "Jarvis, buscá clima en Buenos Aires" | Busca en DuckDuckGo       |
| "Jarvis, ejecutá ls -la"              | Ejecuta un comando en la terminal |
| "Jarvis, listá archivos del Desktop"  | Lista el escritorio       |
| "Jarvis, cerrá Spotify"               | Cierra la aplicación      |
| "Jarvis, volumen 50"                  | Ajusta el volumen al 50%  |

## Agregar un plugin

1. Crea `src/plugins/builtin/miPlugin.ts`:

```typescript
import { BasePlugin, PluginCommand } from '../base'

export default class MiPlugin extends BasePlugin {
  readonly name = 'mi-plugin'
  readonly description = 'Descripción de mi plugin'

  readonly commands: PluginCommand[] = [
    {
      pattern: /hola mundo/i,
      description: 'Saludo',
      handler: async (text, match) => {
        return '¡Hola Mundo desde mi plugin!'
      },
    },
  ]
}
```

2. Reinicia Jarvis; el plugin se carga automáticamente.

Consulta el ejemplo completo en `src/plugins/examples/reminderPlugin.ts`.

## Estructura del proyecto

```
src/
  core/         — Núcleo: assistant, config, memory, events, logger
  voice/        — STT, TTS, wake word
  llm/          — Providers: Ollama, OpenAI, Anthropic, Groq, OpenRouter
  plugins/      — Sistema de plugins + builtin (system, files, web, whatsapp)
  ui/           — Electron: main, preload, renderer (HUD flotante)
  system/       — Control del sistema operativo
  integrations/ — Web search, WhatsApp
config/         — YAML de configuración
data/           — Base de datos SQLite (memoria conversacional)
logs/           — Logs del sistema
```

## Personalización

```yaml
# config/config.yaml
jarvis:
  wakeWord: "oye jarvis"   # Cambiar wake word

voice:
  tts:
    engine: "edge-tts"     # Mejor calidad de voz
    edgeTtsVoice: "es-AR-ElenaNeural"

ui:
  position: "top-right"    # top-left | top-right | bottom-left | bottom-right
  accentColor: "#ff6b00"   # Color del HUD
  opacity: 0.95
```
