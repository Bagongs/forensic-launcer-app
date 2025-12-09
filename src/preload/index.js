import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Jalankan 1 app (analytics / case / encryptor)
  launchApp: (key) => ipcRenderer.invoke('launch-app', key),

  // (opsional) jalankan semua sekaligus
  launchAll: async () => {
    await ipcRenderer.invoke('launch-app', 'analytics')
    await ipcRenderer.invoke('launch-app', 'case')
    await ipcRenderer.invoke('launch-app', 'encryptor')
  },

  // Tutup launcher
  quitLauncher: () => ipcRenderer.send('quit-launcher')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
