'use strict';

/**
 * Electron preload script.
 *
 * Runs in the renderer process before any web content is loaded.
 * contextIsolation is ON and nodeIntegration is OFF, so this script is the
 * only place where Node/Electron APIs can be selectively surfaced to the
 * renderer via contextBridge.
 *
 * The Next.js app is already fully self-contained — it does not need Node APIs
 * in the browser. We expose only a minimal set of read-only metadata that the
 * app could use for Electron-specific behaviour (e.g. hiding the /api/update
 * button, adjusting window chrome styles).
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  /** true when running inside Electron (useful for feature detection in the UI) */
  isElectron: true,
  /** host OS: 'win32' | 'darwin' | 'linux' */
  platform: process.platform,

  /** Check for updates. Returns update status from the main process. */
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  /** Start downloading the update that was found by checkForUpdates. */
  downloadUpdate: () => ipcRenderer.invoke('download-update'),

  /** Quit and install the downloaded update immediately. */
  installUpdate: () => ipcRenderer.invoke('install-update'),

  /**
   * Register a callback for download progress events.
   * Replaces any previously registered listener to avoid accumulation.
   * @param {(p: { percent: number, transferred: number, total: number, bytesPerSecond: number }) => void} cb
   */
  onUpdateProgress(cb) {
    ipcRenderer.removeAllListeners('update-progress');
    ipcRenderer.on('update-progress', (_event, data) => cb(data));
  },

  /**
   * Register a one-shot callback for when the download is complete.
   * @param {(info: { version: string }) => void} cb
   */
  onUpdateDownloaded(cb) {
    ipcRenderer.removeAllListeners('update-downloaded');
    ipcRenderer.once('update-downloaded', (_event, data) => cb(data));
  },
});
