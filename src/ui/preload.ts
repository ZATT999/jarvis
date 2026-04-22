import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('jarvis', {
  onEvent: (cb: (data: { event: string; data: unknown }) => void) => {
    ipcRenderer.on('jarvis-event', (_e, payload) => cb(payload))
  },
  onReply: (cb: (data: { text: string }) => void) => {
    ipcRenderer.on('jarvis-reply', (_e, payload) => cb(payload))
  },
  send: (type: string, payload?: unknown) => {
    ipcRenderer.send('jarvis-command', { type, payload })
  },
  drag: (deltaX: number, deltaY: number) => {
    ipcRenderer.send('window-drag', { deltaX, deltaY })
  },
})
