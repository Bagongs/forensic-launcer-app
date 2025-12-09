import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn } from 'child_process'

const BASE = import.meta.env?.VITE_LAUNCHER_PATH
console.log('[LAUNCHER BASE PATH]:', BASE)

// =============================================================
// CONFIG DEV
// =============================================================
const DEV_APPS = {
  analytics: {
    cmd: join(BASE, 'DataAnalytics', 'win-unpacked', 'Data-Analytics-Platform.exe'),
    args: []
  },
  case: {
    cmd: join(BASE, 'CaseAnalytics', 'win-unpacked', 'Case-Analytics-Platform.exe'),
    args: []
  },
  encryptor: {
    cmd: join(BASE, 'Encryptor', 'win-unpacked', 'Encryptor-Analytics-Platform.exe'),
    args: []
  }
}

// =============================================================
// CONFIG PROD (pakai ENV yang sama)
// =============================================================
const PROD_APPS = { ...DEV_APPS }

const APPS = is.dev ? DEV_APPS : PROD_APPS

function startExternalApp(key) {
  const cfg = APPS[key]
  if (!cfg) {
    console.error('Unknown app key:', key)
    return { ok: false, error: 'Unknown app key' }
  }

  const child = spawn(cfg.cmd, cfg.args, {
    detached: true,
    stdio: 'ignore',
    shell: true
  })

  child.unref()
  return { ok: true }
}


function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    show: true,
    autoHideMenuBar: true,
    fullscreen: true,
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('forensic-launcher-app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createWindow()

  ipcMain.handle('launch-app', (event, key) => {
    const res = startExternalApp(key)
    if (res.ok) {
      const win = BrowserWindow.fromWebContents(event.sender) || mainWindow
      win?.minimize()
    }
    return res
  })

  ipcMain.on('quit-launcher', () => app.quit())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
