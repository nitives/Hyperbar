// Get the search input element
const searchInput = document.getElementById('search-input');

// Add event listener for keydown event
document.addEventListener('keydown', function(event) {
    // Check if ESC key is pressed
    if (event.key === 'Escape') {
        // Send message to main process to close the window
        ipcRenderer.send('close-me');
    }
});
