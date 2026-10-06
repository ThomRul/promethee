import { app, BrowserWindow, session } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const currentDir = dirname(fileURLToPath(import.meta.url));
await app.whenReady();
session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) =>
  callback(false),
);
session.defaultSession.setPermissionCheckHandler(() => false);
function createWindow() {
  const window = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: join(currentDir, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    const url = new URL(devUrl);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1'].includes(url.hostname)
    )
      throw new Error('Origine locale attendue');
    void window.loadURL(devUrl);
  } else void window.loadFile(join(currentDir, '../renderer/index.html'));
}
createWindow();
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
