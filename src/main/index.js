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
    cwd: '/Users/sii/My Documents/work/forensic-analytics-app',
    cmd: 'npm',
    args: ['run', 'dev']
  },
  case: {
    cwd: '/Users/sii/My Documents/work/forensic-case-app',
    cmd: 'npm',
    args: ['run', 'dev']
  },
  encryptor: {
    cwd: '/Users/sii/Documents/file-encryptor-app',
    cmd: 'npm',
    args: ['run', 'dev']
  }
}

// ===============================
// CONFIG PROD: buka .app hasil build
// GANTI path di bawah sesuai lokasi .app milikmu
// ===============================
const PROD_APPS = {
  analytics: {
    cmd: 'open',
    // -n = buka instance baru (kalau sudah jalan tidak fokusin yang lama)
    args: ['-n', '/Applications/DigiFor/Forensic Analytics Platform.app']
  },
  case: {
    cmd: 'open',
    args: ['-n', '/Applications/DigiFor/Forensic Case Platform.app']
  },
  encryptor: {
    cmd: 'open',
    args: ['-n', '/Applications/DigiFor/File Encryptor.app']
  }
}

// Pakai config sesuai environment
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

  // Kalau dev dan ada cwd, kita set working directory-nya
  if (cfg.cwd) {
    options.cwd = cfg.cwd
  }

  const child = spawn(cfg.cmd, cfg.args, options)
  child.unref()

  return { ok: true }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
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
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC lama (boleh dibiarkan)
  ipcMain.on('ping', () => console.log('pong'))

  // IPC baru: dipanggil dari React
  ipcMain.handle('launch-app', (_event, key) => {
    return startExternalApp(key)
  })

  ipcMain.on('quit-launcher', () => {
    app.quit()
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
