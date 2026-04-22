import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } from 'electron'
import { join } from 'path'
import { getConfig } from '../core/config'
import { getEventBus, Events } from '../core/eventBus'
import { getLogger } from '../core/logger'
import { Assistant } from '../core/assistant'

const log = getLogger('electron-main')
let win: BrowserWindow | null = null
let tray: Tray | null = null
let assistant: Assistant | null = null
const bus = getEventBus()

function createWindow() {
  const cfg = getConfig()
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const W = cfg.getOrDefault(80, 'ui', 'width')
  const H = cfg.getOrDefault(80, 'ui', 'height')
  const pos = cfg.getOrDefault('bottom-right', 'ui', 'position')

  const positions: Record<string, [number, number]> = {
    'top-left':     [20, 20],
    'top-right':    [sw - W - 20, 20],
    'bottom-left':  [20, sh - H - 20],
    'bottom-right': [sw - W - 20, sh - H - 20],
  }
  const [x, y] = positions[pos] || positions['bottom-right']

  win = new BrowserWindow({
    width: W,
    height: H,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: cfg.getOrDefault(true, 'ui', 'alwaysOnTop'),
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  win.setIgnoreMouseEvents(false)
  log.info({ x, y, W, H }, 'HUD window created')
}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  const menu = Menu.buildFromTemplate([
    { label: 'Mostrar Jarvis', click: () => win?.show() },
    { label: 'Ocultar', click: () => win?.hide() },
    { type: 'separator' },
    {
      label: 'Proveedor LLM',
      submenu: [
        { label: 'Ollama (local)', click: () => switchProvider('ollama') },
        { label: 'OpenAI', click: () => switchProvider('openai') },
        { label: 'Anthropic', click: () => switchProvider('anthropic') },
        { label: 'Groq', click: () => switchProvider('groq') },
        { label: 'OpenRouter', click: () => switchProvider('openrouter') },
      ]
    },
    { type: 'separator' },
    { label: 'Salir', click: () => { assistant?.stop(); app.quit() } },
  ])
  tray.setContextMenu(menu)
  tray.setToolTip('Jarvis IA')
}

function switchProvider(name: string) {
  bus.emit('llm.switch', { provider: name })
  log.info({ provider: name }, 'Provider switch requested via tray')
}

// Forward events to renderer
function bridgeEvents() {
  const forward = (event: string) => {
    bus.on(event, (data) => win?.webContents.send('jarvis-event', { event, data }))
  }
  forward(Events.UI_STATUS)
  forward(Events.SPEECH_RECOGNIZED)
  forward(Events.LLM_RESPONSE_DONE)
  forward(Events.WAKE_WORD_DETECTED)
  forward(Events.TTS_START)
  forward(Events.TTS_DONE)
}

// IPC from renderer
ipcMain.on('jarvis-command', async (_e, { type, payload }) => {
  log.info({ type, payload }, 'IPC command received')
  
  // Listen command - activates microphone
  if (type === 'listen' && assistant) {
    log.info('>>> LISTEN command triggered!')
    try {
      // Send status to UI
      win?.webContents.send('jarvis-event', { event: 'ui.status', data: { status: 'listening' } })
      
      const text = await assistant.listen()
      log.info({ text }, '<<< listen() completed')
      
      if (!text) {
        log.info('No speech detected')
        win?.webContents.send('jarvis-event', { event: 'tts.done', data: {} })
        return
      }
      
      log.info({ text }, 'Speech recognized, processing...')
      // Send speech recognized
      win?.webContents.send('jarvis-event', { event: 'ui.status', data: { status: 'thinking' } })
      
      const reply = await assistant.process(text)
      log.info({ reply: reply?.slice(0, 50) }, 'Response generated')
      win?.webContents.send('jarvis-reply', { text: reply })
    } catch (err) {
      log.error({ err: String(err) }, 'Listen process failed')
      win?.webContents.send('jarvis-event', { event: 'tts.done', data: {} })
    }
    return
  }
  
  // Process text command
  if (type === 'process' && assistant) {
    const reply = await assistant.process(payload.text)
    win?.webContents.send('jarvis-reply', { text: reply })
  }
  if (type === 'switch-provider') {
    bus.emit('llm.switch', { provider: payload.provider })
  }
  if (type === 'move') {
    win?.setPosition(payload.x, payload.y)
  }
})

// Drag support
ipcMain.on('window-drag', (_e, { deltaX, deltaY }) => {
  if (!win) return
  const [x, y] = win.getPosition()
  win.setPosition(x + deltaX, y + deltaY)
})

app.whenReady().then(async () => {
  createWindow()
  createTray()
  bridgeEvents()

  assistant = new Assistant()
  await assistant.start()

  bus.on('llm.switch', (data) => {
    const d = data as { provider: string }
    // assistant.llm.switch(d.provider) - would need to expose
    log.info({ provider: d.provider }, 'Provider switch (restart required for full effect)')
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
