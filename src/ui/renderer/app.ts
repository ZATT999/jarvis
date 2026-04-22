declare const window: Window & {
  jarvis: {
    onEvent: (cb: (data: { event: string; data: unknown }) => void) => void
    onReply: (cb: (data: { text: string }) => void) => void
    send: (type: string, payload?: unknown) => void
    drag: (dx: number, dy: number) => void
  }
}

const app = document.getElementById('app')!

type Status = 'idle' | 'listening' | 'thinking' | 'speaking'

const statusLabels: Record<Status, string> = {
  idle: 'Zatt te escucha',
  listening: 'Te escucho...',
  thinking: 'Pensando...',
  speaking: 'Hablando...',
}

function setStatus(s: Status, text?: string) {
  // Remove all status classes
  app.classList.remove('status-idle', 'status-listening', 'status-thinking', 'status-speaking')
  // Add new status class
  app.classList.add(`status-${s}`)
  
  const tooltip = document.getElementById('tooltip')
  if (tooltip && text) {
    tooltip.textContent = text
  } else if (tooltip) {
    tooltip.textContent = statusLabels[s]
  }
}

// Click to activate listening mode
app.addEventListener('click', () => {
  setStatus('listening', 'Habla ahora...')
  window.jarvis.send('listen')  // Activate microphone
})

// Receive events from main process
window.jarvis.onEvent(({ event, data }) => {
  const d = data as Record<string, unknown>
  switch (event) {
    case 'wake_word.detected':
    case 'ui.status':
      const status = (d?.status as Status) || 'listening'
      setStatus(status, d?.text as string)
      break
    case 'voice.speech.recognized':
      setStatus('thinking', `Entendí: ${(d?.text as string)?.slice(0, 30)}`)
      break
    case 'llm.response.done':
      setStatus('speaking', (d?.text as string)?.slice(0, 40))
      break
    case 'tts.done':
      setTimeout(() => setStatus('idle'), 2000)
      break
    case 'system.ready':
      setStatus('idle', 'Zatt listo')
      break
  }
})

// Drag support for window movement
let dragStart: { x: number; y: number } | null = null
app.addEventListener('mousedown', (e) => { dragStart = { x: e.screenX, y: e.screenY } })
document.addEventListener('mousemove', (e) => {
  if (!dragStart) return
  window.jarvis.drag(e.screenX - dragStart.x, e.screenY - dragStart.y)
  dragStart = { x: e.screenX, y: e.screenY }
})
document.addEventListener('mouseup', () => { dragStart = null })

// Initial status
setStatus('idle')