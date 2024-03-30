const searchInput = document.getElementById('search-input');
const aiReplyElement = document.getElementById('ai-reply');
const aiResponseElement = document.getElementById('ai-response');
let inputHistory = [];
let historyIndex = -1;

if (searchInput) {
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
} else {
        console.log('"search-input" Does not exist on this page');
}



// Animate the AI response
window.electronAPI.receiveAIResponse((response) => {
    animateTyping(aiReplyElement, response);
});

// Function to handle the typing effect
function animateTyping(element, text) {
    element.textContent = ''; // Clear the text content
    aiResponseElement.style.display = 'block';
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text[i++];
            // Send the updated size to the main process every time the text updates
            window.electronAPI.resizeWindow(aiResponseElement.offsetHeight);
        } else {
            clearInterval(interval);
            // Once the typing animation is done, we send a final resize request
            window.electronAPI.resizeWindow(aiResponseElement.offsetHeight);
        }
    }, 50); // Speed of typing, in milliseconds
}

// Example function to send the new height to the main process
window.electronAPI.resizeWindow = (newHeight) => {
    ipcRenderer.send('resize-window', newHeight);
};
// ----------------------------------------------------------------------

console.log('Settings Button Success - settingsBtn');
// Settings button event handler
const settingsBtn = document.getElementById('settings-btn');
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        window.electronAPI.openSettings();
        console.log('Settings Button Clicked');
    });
}

// ----------------------------------------------------------------------
// Settings close button
console.log('Settings Close Button Success - settingsCloseBtn');
const settingsCloseBtn = document.getElementById('close-window');

if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener('click', () => {
        window.electronAPI.closeSettings();
        console.log('Close Settings Button Clicked');
    });
}

// ----------------------------------------------------------------------
// Theme / Accent Color
console.log('Accent Script Success - setAccentColor');
window.electronAPI.setAccentColor((color) => {
    console.log('Accent Color Set');
    document.documentElement.style.setProperty('--accent-color', `#${color}`)
});

// ----------------------------------------------------------------------

console.log("preload.js loaded");