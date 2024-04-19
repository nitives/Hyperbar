const searchInput = document.getElementById("search-input");
const aiReplyElement = document.getElementById("ai-reply");
const aiResponseElement = document.getElementById("ai-response");
const saveButton = document.getElementById("save-api-key");
const instructionsBtn = document.getElementById("saveInstructions");
const ipcRenderer = window.electronAPI;
let inputHistory = [];
let historyIndex = -1;
let isRequestInProgress = false;

// Add logic to determine if we are in the settings window.
const isSettingsWindow = document.body.classList.contains("settings-window");

// A helper function to send the resize request for the appropriate window
function sendResizeRequest(windowId, contentHeight) {
  if (!isSettingsWindow) {
    window.electronAPI.resizeWindow(windowId, contentHeight);
  }
}

if (searchInput) {
  searchInput.addEventListener("keydown", async function (event) {
    if (event.key === "Enter" && !isRequestInProgress) {
      isRequestInProgress = true;
      searchInput.disabled = true; // Disable the input to prevent multiple requests

      // Save input to history and reset index
      inputHistory = [event.target.value, ...inputHistory.slice(0, 4)];
      historyIndex = -1;

      // Clear the previous response and hide the response element
      aiReplyElement.textContent = "";
      aiResponseElement.style.display = "none";

      // Send the query to the main process
      window.electronAPI.sendAIQuery(event.target.value);
    } else if (event.key === "ArrowUp") {
      // Move back in input history
      historyIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
      searchInput.value = inputHistory[historyIndex] || "";
      event.preventDefault(); // Prevent cursor from moving
    } else if (event.key === "ArrowDown") {
      // Move forward in input history
      historyIndex = Math.max(historyIndex - 1, -1);
      searchInput.value = inputHistory[historyIndex] || "";
      event.preventDefault(); // Prevent cursor from moving
    }
  });
} else {
  console.log('"search-input" Does not exist on this page');
}

// Animate the AI response
window.electronAPI.receiveAIResponse((response) => {
  aiResponseElement.style.display = "block";
  animateTyping(aiReplyElement, response, () => {
    // Re-enable the input once the typing animation is complete
    searchInput.disabled = false;
    isRequestInProgress = false;
  });
  window.electronAPI.resizeWindow(windowId, aiResponseElement.offsetHeight);
});

// Function to handle the typing effect
function animateTyping(element, text, onComplete, windowId) {
  element.textContent = ""; // Clear the text content
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      element.textContent += text[i++];
      sendResizeRequest(windowId, aiResponseElement.offsetHeight);
    } else {
      clearInterval(interval);
      sendResizeRequest(windowId, aiResponseElement.offsetHeight);
      if (typeof onComplete === "function") {
        onComplete(); // Call the callback function
      }
    }
  }, 50); // Speed of typing, in milliseconds
}

// ----------------------------------------------------------------------

console.log("Settings Button Success - settingsBtn");
// Settings button event handler
const settingsBtn = document.getElementById("settings-btn");
if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    window.electronAPI.openSettings();
    console.log("Settings Button Clicked");
  });
}

// Themes -------------------------------------------------------------------
// Dark and Light

document.getElementById("dark-mode").addEventListener("click", async () => {
  await window.ThemeMode.darkButton();
  document.getElementById("theme-source").innerHTML = "Dark";
});

document.getElementById("light-mode").addEventListener("click", async () => {
  await window.ThemeMode.lightButton();
  document.getElementById("theme-source").innerHTML = "Light";
});

document
  .getElementById("reset-to-system")
  .addEventListener("click", async () => {
    await window.ThemeMode.system();
    document.getElementById("theme-source").innerHTML = "System";
  });

//------------------------------------
// Transparency

// ----------------------------------------------------------------------
// Settings close button
document.addEventListener("DOMContentLoaded", (event) => {
  const settingsCloseBtn = document.getElementById("close-window");
  if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener("click", () => {
      window.electronAPI.closeSettings();
      console.log("Close Settings Button Clicked");
    });
  } else {
    console.log("Close button not found");
  }
});

// ----------------------------------------------------------------------

console.log("Accent Script Success - setAccentColor");
window.electronAPI.setAccentColor((color) => {
  console.log("Accent Color Set");
  document.documentElement.style.setProperty("--accent-color", `#${color}`);
});

// ----------------------------------------------------------------------
// API Key for settings

if (saveButton) {
  saveButton.addEventListener("click", () => {
    const apiKey = document.getElementById("api-input").value;
    // Call the method to save the API key through electronAPI
    if (
      window.electronAPI &&
      typeof window.electronAPI.saveApiKey === "function"
    ) {
      window.electronAPI.saveApiKey(apiKey);
    }
  });
}

// Listen for the reply from the main process
window.electronAPI.onApiKeyStatus((status) => {
  const statusElement = document.getElementById("api-key-status");
  if (status.valid) {
    statusElement.style.color = "#42dd76";
    statusElement.textContent = "API Key is valid!";
  } else {
    statusElement.style.color = "#ff4c4c";
    statusElement.textContent = `Invalid API Key | ${status.message}`;
  }
});

// API Key for settings - End
// ----------------------------------------------------------------------

// Open on startup

// This should be in the script for your settings page.
document.addEventListener("DOMContentLoaded", () => {
  const startupCheckbox = document.getElementById("StartupToggle");
  startupCheckbox.addEventListener("change", (event) => {
    const shouldStartOnLogin = event.target.checked;
    window.electronAPI.toggleStartup(shouldStartOnLogin);
  });

  // Initialize the checkbox based on the current setting
  window.electronAPI.getStartupPreference().then((startOnLogin) => {
    startupCheckbox.checked = startOnLogin;
  });
});

// Open on startup - End
// ----------------------------------------------------------------------

// Resize bar
const sidebar = document.getElementById("default-sidebar");
const handle = document.getElementById("drag-handle");

const MIN_WIDTH = 200; // Set the minimum width of the sidebar
const MAX_WIDTH = 400; // Set the maximum width of the sidebar

let isResizing = false;

handle.addEventListener("mousedown", function (e) {
  // Prevents the sidebar from getting selected during dragging
  e.preventDefault();
  isResizing = true;
});

document.addEventListener("mousemove", function (e) {
  if (!isResizing) return;

  let newWidth = e.clientX; // The new width based on the cursor's position

  // Clamp newWidth between the min and max values
  newWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);

  sidebar.style.width = `${newWidth}px`;
});

document.addEventListener("mouseup", function () {
  isResizing = false;
});

// ----------------------------------------------------------------------

// Instructions - Start

// Listen for the save instructions button click
if (instructionsBtn) {
  instructionsBtn.addEventListener("click", () => {
    const instructions = document.getElementById("instructionsInput").value;
    // Call the method to save the instructions through electronAPI
    if (
      window.electronAPI &&
      typeof window.electronAPI.saveInstructions === "function"
    ) {
      window.electronAPI.saveInstructions(instructions);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const savedInstructions = await window.electronAPI.getInstructions();
  const instructionsInput = document.getElementById("instructionsInput");
  if (instructionsInput) {
    instructionsInput.value = savedInstructions;
  }

  // Open Always on Top
  const alwaysOnTopToggle = document.getElementById("AlwaysOnTopToggle");
  alwaysOnTopToggle.checked = await window.electronAPI.getAlwaysOnTopSetting();
  alwaysOnTopToggle.addEventListener("change", (event) => {
    window.electronAPI.toggleAlwaysOnTop(event.target.checked);
  });
});

// -----------------------------------

// Listen for input in the textarea
const instructionsInput = document.getElementById("instructionsInput");
const instructionsContainer = document.getElementById("instructAreaCon");
const instructionsStatus = document.getElementById("instructions-status");
const saveInstructions = document.getElementById("saveInstructions");

instructionsInput.addEventListener("input", () => {
  // Change the outline to red and display the warning
  instructionsContainer.style.outline = "2px solid hsla(0, 100%, 65%, .8)";
  instructionsStatus.textContent = "Unsaved changes";
});

saveInstructions.addEventListener("click", () => {
  // Change the outline to green and display the save confirmation
  instructionsContainer.style.outline = "2px solid hsla(140, 70%, 56%, .8)";
  instructionsStatus.style.opacity = "1";
  instructionsStatus.textContent = "Changes saved";

  // After 3 seconds, reset to the default styles and clear the save confirmation message
  setTimeout(() => {
    instructionsContainer.style.outline = "";
    instructionsContainer.classList.add("bg-white/15", "dark:bg-black/10"); // reapply your default classes if they were removed
    instructionsStatus.textContent = "";
  }, 2000);
});

// Instructions - End -----------------------------------------------------

// Local shortcuts

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    window.electronAPI.hideWindow();
  }
});

// ----------------------------------------------------------------------

// Custom Shortcuts

document.getElementById("saveShortcut").addEventListener("click", () => {
  const shortcut = document.getElementById("openHyperbarShortcut").value;
  window.electronAPI.saveShortcut("openHyperbar", shortcut);
});

function handleShortcutInput(event) {
  event.preventDefault(); // Prevent default to stop things like Ctrl+R reloading the page

  const keys = [];
  if (event.ctrlKey) keys.push("Control");
  if (event.shiftKey) keys.push("Shift");
  if (event.altKey) keys.push("Alt");
  if (event.metaKey) keys.push("Meta"); // Command key for Mac

  // Only add the key if it's not a modifier, unless it's a special case like Space
  if (
    !["Control", "Shift", "Alt", "Meta"].includes(event.key) &&
    event.key.length === 1
  ) {
    keys.push(event.key.toUpperCase()); // Ensure letters are capitalized
  } else if (
    event.code &&
    ![
      "ControlLeft",
      "ControlRight",
      "ShiftLeft",
      "ShiftRight",
      "AltLeft",
      "AltRight",
      "MetaLeft",
      "MetaRight",
    ].includes(event.code)
  ) {
    keys.push(event.code);
  }

  // Update the input's value
  event.target.value = keys.join("+");
}

// ----------------------------------------------------------------------

function showToast(duration) {
  const toaster = document.getElementById("toaster");
  toaster.classList.remove("hidden", "hide");
  toaster.classList.add("show");

  const hideTimeout = setTimeout(() => hideToast(), duration);

  function hideToast() {
    clearTimeout(hideTimeout);
    toaster.classList.remove("show");
    toaster.classList.add("hide");
    setTimeout(() => {
      toaster.classList.add("hidden");
    }, 500);
  }

  toaster.addEventListener("click", hideToast, { once: true });
}

document.getElementById("saveInstructions").addEventListener("click", () => {
  showToast(2700);
});

// ----------------------------------------------------------------------

console.log("renderer.js loaded");
