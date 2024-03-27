import { ipcRenderer } from 'electron';

// Assign ipcRenderer to window object
window.ipcRenderer = ipcRenderer;
console.log('ipcRenderer is available');

// Listen for user input in the search bar
document.getElementById('search-input').addEventListener('keydown', async function(event) {
    if (event.key === 'Enter') {
        const query = event.target.value;
        const aiResponse = await queryOpenAI(query);
        // Send AI response to main process
        ipcRenderer.send('ai-response', aiResponse);
    }
});
