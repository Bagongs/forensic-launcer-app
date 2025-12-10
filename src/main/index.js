import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn } from 'child_process'
import axios from 'axios'

const BASE = import.meta.env?.VITE_LAUNCHER_PATH
const BACKEND_BASE = import.meta.env?.VITE_BACKEND_URL
console.log('[LAUNCHER BASE PATH]:', BASE)

// =============================================================
// LICENSE TEST 5 Menit
// =============================================================

// Waktu saat modul ini di-load (saat app start)
const NOW = new Date()
const LICENSE_START = NOW
const LICENSE_END = new Date(NOW.getTime() + 5 * 60 * 1000) // +5 menit

console.log('[LICENSE TEST] Start :', LICENSE_START)
console.log('[LICENSE TEST] End   :', LICENSE_END)

function isLicenseValid() {
  // ❗ Kalau mau bebas saat development, bisa aktifkan lagi ini:
  // if (is.dev) return true

  const now = new Date()
  return now >= LICENSE_START && now < LICENSE_END
}

function showLicenseErrorAndQuit() {
  dialog.showMessageBoxSync({
    type: 'error',
    title: 'License expired',
    message:
      'Masa berlaku aplikasi test (5 menit) sudah berakhir atau belum dimulai.\n\n' +
      `Periode lisensi sementara:\n${LICENSE_START.toString()} — ${LICENSE_END.toString()}\n\n` +
      'Silakan restart aplikasi untuk reset waktu test.'
  })
  app.quit()
}

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
  // Cek lisensi setiap kali mau launch external app
  if (!isLicenseValid()) {
    dialog.showMessageBox({
      type: 'error',
      title: 'License expired',
      message:
        'Lisensi test 5 menit sudah berakhir.\n' +
        'Silakan tutup dan buka kembali launcher untuk mengulang masa test.'
    })
    return { ok: false, error: 'license_expired' }
  }

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
  // 🔒 Cek lisensi saat app mulai
  if (!isLicenseValid()) {
    showLicenseErrorAndQuit()
    return
  }

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
    if (BrowserWindow.getAllWindows().length === 0) {
      // Kalau buka lagi dari dock/taskbar, cek lisensi lagi
      if (!isLicenseValid()) {
        showLicenseErrorAndQuit()
        return
      }
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('license:getInfo', async () => {
  try {
    const res = await axios.get(`${BACKEND_BASE}/license`)
    return res.data
  } catch (error) {
    console.error('[IPC license:getInfo] Error:', error)
    return {
      status: 500,
      message: 'Failed to get license',
      error: error.message
    }
  }
})
