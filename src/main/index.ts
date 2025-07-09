import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { store } from './config-store';

// @ts-ignore
import { start_server as movie_agent_start } from "./a2a/movie/movie-agent";


// @ts-ignore 'unused'
function _debug_app_data() {
  let n1 = app.getName();
  console.info(`app name is: ${n1}`);     // aigx5
  
  let p2 = app.getAppPath();
  console.info(`app path: ${p2}`);        // D:\project\aigx5

  let p = app.getPath('userData');        // C:\Users\myname\AppData\Roaming\aigx5
  console.info(`app user-data path: ${p}`);
}

function createWindow(): void {
  // _debug_app_data();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: is.dev ? false : true,      // 为了能访问外部网站 设置为危险的 false ...
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    // 当开发模式时, 打开调试工具.
    if (is.dev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Attach React DevTools
  if (is.dev) {
    // require('react-devtools');
  }
}

// 抑制 log 信息 (不生效)
if (is.dev) {
  app.commandLine.appendSwitch('disable-features', 'AutofillEnable');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.lexue100.liujunxing.aigx5');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  });

  // IPC test (暂关闭)
  // ipcMain.on('ping', () => console.log('pong'))

  // todo: 启动 movie agent server
  // await movie_agent_start();

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// # IPC

ipcMain.handle('get-store', () => {
  return store.store;
});

ipcMain.handle('set-store', (_event, value) => {
  store.store = value;
});


/*
ipcMain.handle('getStoreValue', (_event, key) => {
  return store.get(key);
});

ipcMain.handle('setStoreValue', (_event, key, dataJson) => {
  const data = JSON.parse(dataJson)
  return store.set(key, data)
});

ipcMain.handle('delStoreValue', (_event, key) => {
  return store.delete(key)
});
*/
