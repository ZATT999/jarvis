# Jarvis — Asistente de IA Personal

Asistente de inteligencia artificial personal avanzado, ejecutado localmente con interfaz flotante, activación por voz y soporte para múltiples proveedores de LLM.

## Instalación rápida

```bash
cd /dev/jarvis
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

Editá `config/config.yaml`:

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

| Decís...                              | Acción                    |
|---------------------------------------|---------------------------|
| "Jarvis, abrí Firefox"               | Abre Firefox              |
| "Jarvis, qué hora es"                | Dice la hora              |
| "Jarvis, buscá clima en Buenos Aires" | Busca en DuckDuckGo       |
| "Jarvis, ejecutá ls -la"             | Ejecuta comando terminal  |
| "Jarvis, listá archivos del Desktop" | Lista el escritorio       |
| "Jarvis, cerré Spotify"              | Cierra la aplicación      |
| "Jarvis, volumen 50"                 | Ajusta volumen al 50%     |

## Agregar un plugin

1. Creá `src/plugins/builtin/miPlugin.ts`:

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

2. Reiniciá Jarvis — el plugin se carga automáticamente.

Ver ejemplo completo en `src/plugins/examples/reminderPlugin.ts`.

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
