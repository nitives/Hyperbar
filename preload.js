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
    resizeWindow: (newHeight) => ipcRenderer.send('resize-window', newHeight)
});


// Window resize react to response
window.addEventListener('DOMContentLoaded', () => {
    // Once the content is loaded, measure the element
    const contentSize = document.getElementById('response').getBoundingClientRect();
    // Send the height to the main process
    ipcRenderer.send('resize-window', contentSize.height);
});
