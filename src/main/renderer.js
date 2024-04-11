const searchInput = document.getElementById('search-input');
const aiReplyElement = document.getElementById('ai-reply');
const aiResponseElement = document.getElementById('ai-response');
const saveButton = document.getElementById('save-api-key');
const instructionsBtn = document.getElementById('saveInstructions');
const ipcRenderer = window.electronAPI;
let inputHistory = [];
let historyIndex = -1;

// Add logic to determine if we are in the settings window.
const isSettingsWindow = document.body.classList.contains('settings-window');

// A helper function to send the resize request for the appropriate window
function sendResizeRequest(windowId, contentHeight) {
  if (!isSettingsWindow) {
    window.electronAPI.resizeWindow(windowId, contentHeight);
  }
}

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
  aiResponseElement.style.display = 'block';
  animateTyping(aiReplyElement, response);
  window.electronAPI.resizeWindow(windowId, aiResponseElement.offsetHeight);
});

// Function to handle the typing effect
function animateTyping(element, text, windowId) {
  element.textContent = ''; // Clear the text content
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      element.textContent += text[i++];
      sendResizeRequest(windowId, aiResponseElement.offsetHeight);
    } else {
      clearInterval(interval);
      sendResizeRequest(windowId, aiResponseElement.offsetHeight);
    }
  }, 50); // Speed of typing, in milliseconds
}

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
document.addEventListener('DOMContentLoaded', (event) => {
    const settingsCloseBtn = document.getElementById('close-window');
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', () => {
        window.electronAPI.closeSettings();
        console.log('Close Settings Button Clicked');
      });
    } else {
      console.log("Close button not found");
    }


    
  let windowId = require('electron').remote.getCurrentWindow().id;
  });

// ----------------------------------------------------------------------

console.log('Accent Script Success - setAccentColor');
window.electronAPI.setAccentColor((color) => {
    console.log('Accent Color Set');
    document.documentElement.style.setProperty('--accent-color', `#${color}`)
});

// ----------------------------------------------------------------------
// API Key for settings

  if (saveButton) {
    saveButton.addEventListener('click', () => {
        const apiKey = document.getElementById('api-input').value;
        // Call the method to save the API key through electronAPI
        if(window.electronAPI && typeof window.electronAPI.saveApiKey === 'function') {
            window.electronAPI.saveApiKey(apiKey);
        }
    });
  }

// Listen for the reply from the main process
window.electronAPI.onApiKeyStatus((status) => {
    const statusElement = document.getElementById('api-key-status');
    if (status.valid) {
        statusElement.style.color = '#42dd76';
        statusElement.textContent = 'API Key is valid!';
    } else {
        statusElement.style.color = '#ff4c4c';
        statusElement.textContent = `Invalid API Key | ${status.message}`;
    }
});
  

// API Key for settings - End
// ----------------------------------------------------------------------

// Open on startup

window.electronAPI.getStartupPreference().then((startOnLogin) => {
    const startupCheckbox = document.getElementById('StartupToggle');
    startupCheckbox.checked = startOnLogin;
  });

// Open on startup - End
// ----------------------------------------------------------------------



// Resize bar
const sidebar = document.getElementById('default-sidebar');
const handle = document.getElementById('drag-handle');

const MIN_WIDTH = 200; // Set the minimum width of the sidebar
const MAX_WIDTH = 400; // Set the maximum width of the sidebar

let isResizing = false;

handle.addEventListener('mousedown', function(e) {
  // Prevents the sidebar from getting selected during dragging
  e.preventDefault();
  isResizing = true;
});

document.addEventListener('mousemove', function(e) {
  if (!isResizing) return;

  let newWidth = e.clientX; // The new width based on the cursor's position

  // Clamp newWidth between the min and max values
  newWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);

  sidebar.style.width = `${newWidth}px`;
});

document.addEventListener('mouseup', function() {
  isResizing = false;
});


// ----------------------------------------------------------------------

// Instructions - Start

// Listen for the save instructions button click
if (instructionsBtn) {
  instructionsBtn.addEventListener('click', () => {
      const instructions = document.getElementById('instructionsInput').value;
      // Call the method to save the instructions through electronAPI
      if(window.electronAPI && typeof window.electronAPI.saveInstructions === 'function') {
          window.electronAPI.saveInstructions(instructions);
      }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const savedInstructions = await window.electronAPI.getInstructions();
  const instructionsInput = document.getElementById('instructionsInput');
  if (instructionsInput) {
    instructionsInput.value = savedInstructions;
  }
});



// -----------------------------------

// Listen for input in the textarea
const instructionsInput = document.getElementById('instructionsInput');
const instructionsContainer = document.getElementById('instructAreaCon');
const instructionsStatus = document.getElementById('instructions-status');
const saveInstructions = document.getElementById('saveInstructions');

instructionsInput.addEventListener('input', () => {
  // Change the outline to red and display the warning
  instructionsContainer.style.outline = '2px solid hsla(0, 100%, 65%, .8)';
  instructionsStatus.textContent = 'Unsaved changes';
});

saveInstructions.addEventListener('click', () => {
  // Change the outline to green and display the save confirmation
  instructionsContainer.style.outline = '2px solid hsla(140, 70%, 56%, .8)';
  instructionsStatus.style.opacity = '1';
  instructionsStatus.textContent = 'Changes saved';

  // After 3 seconds, reset to the default styles and clear the save confirmation message
  setTimeout(() => {
    instructionsContainer.style.outline = '';
    instructionsContainer.classList.add('bg-white/15', 'dark:bg-black/10'); // reapply your default classes if they were removed
    instructionsStatus.textContent = '';
  }, 2000);
});

// Instructions - End
// ----------------------------------------------------------------------

// Local shortcuts

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.electronAPI.hideWindow();
    }
  });

// ----------------------------------------------------------------------
// Toggle Transparency



// ----------------------------------------------------------------------

console.log("renderer.js loaded");