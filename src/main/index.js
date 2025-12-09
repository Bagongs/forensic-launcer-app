import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn } from 'child_process'

// ===============================
// CONFIG DEV: npm run dev
// ===============================
const DEV_APPS = {
  analytics: {
    cmd: 'C:\\work\\sii\\launcher\\DataAnalytics\\win-unpacked\\Data-Analytics-Platform.exe',
    args: []
  },
  case: {
    cmd: 'C:\\work\\sii\\launcher\\CaseAnalytics\\win-unpacked\\Case-Analytics-Platform.exe',
    args: []
  },
  encryptor: {
    cmd: 'C:\\work\\sii\\launcher\\Encryptor\\win-unpacked\\Encryptor-Analytics-Platform.exe',
    args: []
  }
}

// ===============================
// CONFIG PROD
// ===============================
const PROD_APPS = {
  analytics: {
    cmd: 'C:\\work\\sii\\launcher\\DataAnalytics\\win-unpacked\\Data-Analytics-Platform.exe',
    args: []
  },
  case: {
    cmd: 'C:\\work\\sii\\launcher\\CaseAnalytics\\win-unpacked\\Case-Analytics-Platform.exe',
    args: []
  },
  encryptor: {
    cmd: 'C:\\work\\sii\\launcher\\Encryptor\\win-unpacked\\Encryptor-Analytics-Platform.exe',
    args: []
  }
}

const APPS = is.dev ? DEV_APPS : PROD_APPS

function startExternalApp(key) {
  const cfg = APPS[key]
  if (!cfg) {
    console.error('Unknown app key:', key)
    return { ok: false, error: 'Unknown app key' }
  }

  const options = {
    detached: true,
    stdio: 'ignore',
    shell: true
  }

  if (cfg.cwd) {
    options.cwd = cfg.cwd
  }

  const child = spawn(cfg.cmd, cfg.args, options)
  child.unref()

  return { ok: true }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    show: true,
    autoHideMenuBar: true,
    fullscreen: true,                // ⬅️ bisa dimatiin kalau mau
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

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

  ipcMain.on('ping', () => console.log('pong'))

  const mainWindow = createWindow()

  // IPC baru: dipanggil dari React
  ipcMain.handle('launch-app', (event, key) => {
    const res = startExternalApp(key)

    if (res.ok) {
      // Cari window launcher berdasarkan sender, fallback ke mainWindow
      const win = BrowserWindow.fromWebContents(event.sender) || mainWindow
      if (win) {
        // if (win.isFullScreen()) {
        //   win.setFullScreen(false)
        // }
        win.minimize()
        // atau win.blur() kalau nggak mau minimize
      }
    }

    return res
  })

  ipcMain.on('quit-launcher', () => {
    app.quit()
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
