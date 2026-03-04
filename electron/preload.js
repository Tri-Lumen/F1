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
  /**
   * Ask the main process to trigger autoUpdater.checkForUpdatesAndNotify().
   * Returns { triggered: true } on success or { triggered: false, error: string } if
   * auto-update is not configured in this build.
   */
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
});
