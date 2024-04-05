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
    hideWindow: () => ipcRenderer.send('hide-window'),
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

    // API Key Input section starts here
    
    saveApiKey: (apiKey) => ipcRenderer.send('save-api-key', apiKey),
    onApiKeyStatus: (callback) => { ipcRenderer.on('api-key-status', (event, ...args) => callback(...args)); },

    // ------------- API Key Input section ends here
});


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
      } else {
          console.error("Element with ID 'response' was not found in the main window.");
      }
    }
  });
  
// ----------------------------------------------------------------------
// Open on startup
const startupCheckbox = document.getElementById('startup-checkbox');

startupCheckbox.addEventListener('change', () => {
  const shouldStartOnLogin = startupCheckbox.checked;
  window.electronAPI.toggleStartup(shouldStartOnLogin);
});

// ----------------------------------------------------------------------

console.log("preload.js loaded");