const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendAIQuery: (query) => ipcRenderer.send('ai-query', query),
    receiveAIResponse: (callback) => {
        ipcRenderer.on('ai-response', (event, ...args) => callback(...args));
    },
    typingEffectStart: (callback) => {
        ipcRenderer.on('typing-started', (event) => callback());
    },
    typingEffectEnd: (callback) => {
        ipcRenderer.on('typing-ended', (event) => callback());
    },
    resizeWindow: (newHeight) => ipcRenderer.send('resize-window', newHeight),
    openSettings: () => ipcRenderer.send('open-settings'),
    closeSettings: () => {
        ipcRenderer.send('close-settings');
    },
    setAccentColor: (callback) => ipcRenderer.on('set-accent-color', (event, color) => callback(color)),

    // Open on startup
    toggleStartup: (shouldStartOnLogin) => {
        ipcRenderer.send('toggle-startup', shouldStartOnLogin);
    },

    getLoginItemSettings: () => {
        return ipcRenderer.invoke('get-login-settings');
    },
    // -------------

    // API Key Input in Settings
    saveApiKey: (apiKey) => ipcRenderer.send('save-api-key', apiKey),
    onApiKeyStatus: (callback) => ipcRenderer.on('api-key-status', (event, status) => callback(status))
});


// Window resize react to response
window.addEventListener('DOMContentLoaded', () => {
    // Once the content is loaded, measure the element
    const contentSize = document.getElementById('response').getBoundingClientRect();
    // Send the height to the main process
    ipcRenderer.send('resize-window', contentSize.height);
});

// ----------------------------------------------------------------------
// Open on startup
const startupCheckbox = document.getElementById('startup-checkbox');

startupCheckbox.addEventListener('change', () => {
  const shouldStartOnLogin = startupCheckbox.checked;
  window.electronAPI.toggleStartup(shouldStartOnLogin);
});

ipcMain.handle('get-login-settings', () => {
    return app.getLoginItemSettings();
});

// ----------------------------------------------------------------------

console.log("preload.js loaded");