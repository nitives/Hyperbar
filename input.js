const searchInput = document.getElementById('search-input');
searchInput.addEventListener('keydown', async function(event) {
    if (event.key === 'Enter') {
        // Save input to history and reset index
        inputHistory = [event.target.value, ...inputHistory.slice(0, 4)];
        historyIndex = -1;

        // Clear the previous response and hide the response element
        aiReplyElement.textContent = '';
        aiResponseElement.style.display = 'none';

        // Send the query to the main process
        window.electronAPI.sendAIQuery(event.target.value);
    } else if (event.key === 'ArrowUp') {
        // Move back in input history
        historyIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
        searchInput.value = inputHistory[historyIndex] || '';
        event.preventDefault(); // Prevent cursor from moving
    } else if (event.key === 'ArrowDown') {
        // Move forward in input history
        historyIndex = Math.max(historyIndex - 1, -1);
        searchInput.value = inputHistory[historyIndex] || '';
        event.preventDefault(); // Prevent cursor from moving
    }
});