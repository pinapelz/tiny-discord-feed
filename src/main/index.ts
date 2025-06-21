import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is, platform } from '@electron-toolkit/utils'
import { WebSocketServer, WebSocket } from 'ws'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow
let store: import('electron-store').default<{ channelNicknames: Record<string, string> }>

async function initStore(): Promise<void> {
  const Store = (await import('electron-store')).default
  store = new Store({
    defaults: {
      channelNicknames: {}
    }
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: 'tiny-discord-feed',
    autoHideMenuBar: true,
    ...(platform.isLinux ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
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

function setupWebSocket(): void {
  if (!mainWindow) {
    console.error('Cannot setup WebSocket: mainWindow not available')
    return
  }

  const wss = new WebSocketServer({ port: 8765, host: '0.0.0.0' })

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket client connected')
    ws.on('message', (msg: Buffer) => {
      try {
        const parsed = JSON.parse(msg.toString())
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('new-discord-message', parsed)
        }
      } catch (e) {
        console.error('Invalid JSON received:', e)
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error)
    })
  })

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error)
  })

  console.log('WebSocket server listening on 0.0.0.0:8765')
}

function setupIpcHandlers(): void {
  // Get channel nicknames
  ipcMain.handle('config:get-channel-nicknames', () => {
    return store.get('channelNicknames')
  })

  // Set channel nickname
  ipcMain.handle('config:set-channel-nickname', (_, channelId: string, nickname: string) => {
    const nicknames = { ...store.get('channelNicknames') }
    nicknames[channelId] = nickname
    store.set('channelNicknames', nicknames)
    return true
  })

  // Remove channel nickname
  ipcMain.handle('config:remove-channel-nickname', (_, channelId: string) => {
    const nicknames = { ...store.get('channelNicknames') }
    delete nicknames[channelId]
    store.set('channelNicknames', nicknames)
    return true
  })

  // Get all channel nicknames as array
  ipcMain.handle('config:get-channel-list', () => {
    const nicknames = store.get('channelNicknames')
    return Object.entries(nicknames).map(([id, nickname]) => ({ id, nickname }))
  })
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initStore()
  createWindow()
  setupWebSocket()
  setupIpcHandlers()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
