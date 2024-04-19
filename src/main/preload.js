const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Hyper AI --------------------------
    sendAIQuery: (query) => ipcRenderer.send('ai-query', query),
    receiveAIResponse: (callback) => { ipcRenderer.on('ai-response', (event, ...args) => callback(...args)); },
    typingEffectStart: (callback) => { ipcRenderer.on('typing-started', (event) => callback()); },
    typingEffectEnd: (callback) => { ipcRenderer.on('typing-ended', (event) => callback()); },

    // Window --------------------------
    resizeWindow: (windowId, newHeight) => ipcRenderer.send('resize-window', windowId, newHeight),
    hideWindow: () => ipcRenderer.send('hide-window'),
    openSettings: () => ipcRenderer.send('open-settings'),
    closeSettings: () => ipcRenderer.send('close-settings'),

    // Get Accent Color from OS
    setAccentColor: (callback) => ipcRenderer.on('set-accent-color', (event, color) => callback(color)),
    
    // Settings --------------------------
    // Open on startup
    saveShortcut: (action, shortcut) => ipcRenderer.send("save-shortcut", action, shortcut),
    validateAndSaveShortcut: (action, shortcut) => ipcRenderer.invoke("validate-and-save-shortcut", action, shortcut),
    toggleStartup: (shouldStartOnLogin) => ipcRenderer.send('toggle-startup', shouldStartOnLogin),
    // Open Always on Top
    toggleAlwaysOnTop: (isEnabled) => ipcRenderer.send('toggle-always-on-top', isEnabled),
    getAlwaysOnTopSetting: () => ipcRenderer.invoke('get-always-on-top-setting'),

    getLoginItemSettings: () => { return ipcRenderer.invoke('get-login-settings'); },
    getStartupPreference: () => ipcRenderer.invoke('get-startup-preference'),

    // API Key Input
    saveApiKey: (apiKey) => ipcRenderer.send('save-api-key', apiKey),
    onApiKeyStatus: (callback) => { ipcRenderer.on('api-key-status', (event, ...args) => callback(...args)); },

    saveInstructions: (instructions) => ipcRenderer.send('save-instructions', instructions),
    getInstructions: () => ipcRenderer.invoke('get-instructions'),
});

// Theme
contextBridge.exposeInMainWorld('ThemeMode', {
  darkButton: () => ipcRenderer.invoke('theme:dark'),
  system: () => ipcRenderer.invoke('theme:system'),
  lightButton: () => ipcRenderer.invoke('theme:light')
})

document.getElementById('dark-mode').addEventListener('click', async () => {
  await window.ThemeMode.darkButton()
  document.getElementById('theme-source').innerHTML = 'Dark';
})

document.getElementById('light-mode').addEventListener('click', async () => {
  await window.ThemeMode.lightButton()
  document.getElementById('theme-source').innerHTML = 'Light';
})

document.getElementById('reset-to-system').addEventListener('click', async () => {
  await window.ThemeMode.system()
  document.getElementById('theme-source').innerHTML = 'System';
})

// ----------------------------------------------------------------------

// Window resize react to response
window.addEventListener('DOMContentLoaded', () => {
    // Check if we are in the main window by looking for a unique identifier
    const isMainWindow = document.body.id === 'main-window';
    if(isMainWindow) {
      // Check if the element exists before calling getBoundingClientRect
      const responseElement = document.getElementById('response');
      if (responseElement) {
          const contentSize = responseElement.getBoundingClientRect();
          // Send the height to the main process
          ipcRenderer.send('resize-window', contentSize.height);
      } 
      else { console.error("Element with ID 'response' was not found in the main window."); }
    }
  });

// ----------------------------------------------------------------------

// Open on startup
const startupCheckbox = document.getElementById('StartupToggle');
startupCheckbox.addEventListener('change', () => {
  const shouldStartOnLogin = startupCheckbox.checked;
  window.electronAPI.toggleStartup(shouldStartOnLogin);
});

console.log("preload.js loaded");