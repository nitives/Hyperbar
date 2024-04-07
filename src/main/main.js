require('dotenv').config();
const { app, BrowserWindow, ipcMain, nativeImage, globalShortcut, Tray, Menu, systemPreferences, MenuItem } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { saveApiKey, getApiKey } = require('./modules/apiKey.js');
const queryOpenAI = require('./modules/openai.js');

const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

let searchBarWindow;
let searchBarSettingsWindow;

function createSearchBarWindow() {
const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
const windowWidth = 600;
const windowHeight = 125; // Default - 60 // What year did the US gain independence?
const x = Math.floor((width - windowWidth) / 2);
const y = Math.floor((height - windowHeight) / 2);

searchBarWindow = new BrowserWindow({
    title: 'Hyperbar',
    show: false,
    icon: nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png')),
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    opacity: 1.0,
    frame: false, // Default - true
    titleBarStyle: 'hidden',
    transparent: false, // Default - false
    alwaysOnTop: false, // Default - true
    resizable: true, // Default - false
    roundedCorners: true, // Default - true
    vibrancy: 'acrylic',
    backgroundMaterial: 'acrylic',
    backgroundColor: '#00000000',
    webPreferences: {
        sandbox: true,
        preload: path.join(__dirname, './preload.js'),
        contextIsolation: true,
        spellcheck: true,
        nodeIntegration: false
    }
});

searchBarWindow.loadFile(path.join(__dirname, '../front/index.html'));
searchBarWindow.setMenuBarVisibility(false);

// Window blur and animation for focused window ------------------------------------------

searchBarWindow.on('blur', () => {
    searchBarWindow.setBackgroundColor('#1c1c1c'); // 
    searchBarWindow.setVibrancy(null); // Optional: Disable vibrancy
    searchBarWindow.setBackgroundMaterial('none'); // Re-enable the acrylic effect
});

searchBarWindow.on('focus', () => {
    searchBarWindow.setBackgroundColor('#00000033'); // Transparent
    searchBarWindow.setVibrancy('acrylic'); // Re-enable the acrylic effect
    searchBarWindow.setBackgroundMaterial('acrylic'); // Re-enable the acrylic effect
});
}

// ---------------------------------------------------------------------------------------

// Resize window to match text box sizes
ipcMain.on('resize-window', (event, windowId, contentHeight) => {
  const targetWindow = searchBarWindow;
  
  if (targetWindow) {
      // Prevent resizing if this is the settings window
      if (targetWindow.title === 'Settings') {
          return;
      }
      const newHeight = contentHeight + 100; // Adjust padding if needed
      const currentWidth = targetWindow.getBounds().width;
      targetWindow.setSize(currentWidth, newHeight);
  }
});

// Tray Icon Setup and Global Shortcut
app.whenReady().then(() => {
    createSearchBarWindow();
  
    tray = new Tray(path.join(__dirname, '../assets/icon.png'));
    tray.setToolTip('Hyperbar');
  
    // Context menu for tray icon
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show Hyperbar', click: () => searchBarWindow.show() },
      { label: 'Open Settings', click: () => {
        // Create the settings window if it does not exist
        if (!searchBarSettingsWindow) {
          createsearchBarSettingsWindow();
        }
        // Show the settings window
        searchBarSettingsWindow.show();
    }},
      { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
    ]);

    tray.setContextMenu(contextMenu);
  
    // Clicking the tray icon shows the window
    tray.on('click', () => {
      searchBarWindow.isVisible() ? searchBarWindow.hide() : searchBarWindow.show();
    });
  
    // Global shortcut to toggle the window visibility
    const ret = globalShortcut.register('Control+Alt+K', () => {
      if (searchBarWindow.isMinimized()) searchBarWindow.restore();
      else searchBarWindow.isVisible() ? searchBarWindow.hide() : searchBarWindow.show();
    });
  
    if (!ret) {
      console.error('Global shortcut registration failed - Control+Alt+K');
    }

    const ret3 = globalShortcut.register('Control+S', () => {
      if (searchBarWindow.isVisible()) {
        if (!searchBarSettingsWindow) {
          createsearchBarSettingsWindow();
        }
        searchBarSettingsWindow.show();
      };
    });

    if (!ret3) {
      console.error('Global shortcut registration failed - Control+S');
    }

    const ret4 = globalShortcut.register('Control+Q', () => {
      if (searchBarWindow.isVisible() && searchBarWindow.isFocused()) {
        app.exit();
      }
    });
    
    if (!ret4) {
      console.error('Global shortcut registration failed - Control+Q');
    }
    
    // ----------------------------------------------------------------
  
    // Hide the window when it's closed instead of quitting the app
    searchBarWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        searchBarWindow.hide();
      }
    });
  
    // Clean up on app quit
    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
      if (tray) tray.destroy();
    });

    // -------------------------- Theme / Accent Color CSS --------------------------
    // - Here is adding the Theme / Accent Color of the users Windows computer to the css palette
    searchBarWindow.webContents.on('did-finish-load', () => {
      const accentColor = systemPreferences.getAccentColor(); // RGBA hex
      searchBarWindow.webContents.send('set-accent-color', accentColor);
    });

    ensureSettingsFileExists();

  });
// ------------------------------------------------------

ipcMain.on('typing-started', (event) => {
    event.sender.send('typing-started');
});

ipcMain.on('typing-ended', (event) => {
    event.sender.send('typing-ended');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('hide-window', () => {
  if (searchBarWindow) {
    searchBarWindow.hide();
  }
});


// ---------------------------------------------- Settings ----------------------------------------------
// - Here you'll be able to click the icon / svg button to open the settings

function createsearchBarSettingsWindow() {
  // Retrieve the dimensions of the screen
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  // Define the dimensions for the settings window
  const settingsWindowWidth = 1100; // Example width for settings window
  const settingsWindowHeight = 700; // Example height for settings window
  const x = Math.floor((width - settingsWindowWidth) / 2 );
  const y = Math.floor((height - settingsWindowHeight) / 2 );

  // Create a new BrowserWindow for the settings
  searchBarSettingsWindow = new BrowserWindow({
      title: 'Settings',
      width: settingsWindowWidth,
      height: settingsWindowHeight,
      x: x,
      y: y,
      icon: nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png')),
      opacity: 1.0,
      frame: false, // Default - true
      titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      minimizable: false,
      maximizable: false,
      transparent: false, // Default - false
      alwaysOnTop: false, // Default - true
      resizable: true, // Default - false
      roundedCorners: true, // Default - true
      vibrancy: 'acrylic',
      backgroundMaterial: 'acrylic',
      backgroundColor: '#00000000',
      webPreferences: {
          preload: path.join(__dirname, './preload.js'),
          contextIsolation: true,
          nodeIntegration: false
      }
  });

  // Load the HTML file for the settings window
  searchBarSettingsWindow.loadFile(path.join(__dirname, '../front/settings.html'));

  // Hide the window when it's closed, instead of quitting the application
  searchBarSettingsWindow.on('close', (event) => {
      event.preventDefault();
      searchBarSettingsWindow.hide();
  });

  searchBarSettingsWindow.on('blur', () => {
    searchBarSettingsWindow.setBackgroundColor('#1c1c1c'); // 
    searchBarSettingsWindow.setVibrancy(null); // Optional: Disable vibrancy
    searchBarSettingsWindow.setBackgroundMaterial('none'); // Re-enable the acrylic effect
  });
  
  searchBarSettingsWindow.on('focus', () => {
    searchBarSettingsWindow.setBackgroundColor('#00000033'); // Transparent
    searchBarSettingsWindow.setVibrancy('acrylic'); // Re-enable the acrylic effect
    searchBarSettingsWindow.setBackgroundMaterial('acrylic'); // Re-enable the acrylic effect
  });

  searchBarSettingsWindow.webContents.on('did-finish-load', () => {
    const accentColor = systemPreferences.getAccentColor(); // RGBA hex
    searchBarSettingsWindow.webContents.send('set-accent-color', accentColor);
  });

}

// --------------------------- API Key Input ---------------------------

// Handle saving API key from settings
ipcMain.on('save-api-key', (event, apiKey) => {
  saveApiKey(apiKey); // Save the API key using the function from apiKey.js
  event.reply('api-key-saved', true); // Send a confirmation back to the renderer process

  // console.log(`API Key Saved: ${apiKey}`);
  event.reply('api-key-status', { valid: true, message: 'API Key saved successfully!' });
});

ipcMain.on('ai-query', async (event, query) => {
  const apiKey = getApiKey(); // Fetch the API key using the function from apiKey.js
  try {
    // Now pass the apiKey to the queryOpenAI function
    const response = await queryOpenAI(query, apiKey);
    event.reply('ai-response', response);
  } catch (error) {
    console.error('Error querying OpenAI:', error);
    event.reply('ai-response', 'Error: Unable to process your query');
  }
});

// ---------------------------- 
function ensureSettingsFileExists() {
  // Check if the settings file exists, and create it with default values if it doesn't
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify({}));
  }
}
// ---------------------------- API Key Input End ----------------------

// --------------------------- Instructions - Start ---------------------------

// Function to save instructions
function saveInstructions(instructions) {
  let settings = readSettings();
  settings.instructions = instructions;
  saveSettings(settings);
}

ipcMain.on('save-instructions', (event, instructions) => {
  saveInstructions(instructions);
  // You can reply back to renderer process if needed
  event.reply('instructions-saved', true);
});

// Function to get instructions
function getInstructions() {
  let settings = readSettings();
  return settings.instructions || ''; // Return the instructions or an empty string if not set
}

ipcMain.handle('get-instructions', async (event) => {
  return getInstructions();
});

ipcMain.on('save-instructions', (event, instructions) => {
  // Call function to save the instructions
  saveInstructions(instructions);
  event.reply('instructions-status', { success: true, message: 'Instructions saved successfully!' });
});

// Add a function to save instructions
function saveInstructions(instructions) {
  const settings = readSettings(); // This function should read the current settings.json
  settings.instructions = instructions; // Add or update instructions in the settings object
  saveSettings(settings); // This function should save the updated settings object back to settings.json
}
// ---------------------------- Instructions - End ----------------------

ipcMain.on('open-settings', (event) => {
  if (!searchBarSettingsWindow) {
    createsearchBarSettingsWindow();
  }
  searchBarSettingsWindow.show();
});

// Custom Close Button
ipcMain.on('close-settings', (event) => {
  if (searchBarSettingsWindow && !searchBarSettingsWindow.isDestroyed()) {
    searchBarSettingsWindow.close();
  }
});

// ---------------------------------------------- Settings - End ----------------------------------------------

// --------------------------- Open on startup -------------------------
ipcMain.on('toggle-startup', (event, shouldStartOnLogin) => {
  app.setLoginItemSettings({
    openAtLogin: shouldStartOnLogin,
  });
});

ipcMain.handle('get-login-settings', () => {
  return app.getLoginItemSettings();
});

// Read settings from the file
function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath));
  } catch (error) {
    return {}; // If file does not exist or error occurs, return an empty object
  }
}

// Save settings to the file
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Toggle startup in settings
ipcMain.on('toggle-startup', (event, shouldStartOnLogin) => {
  const settings = readSettings();
  settings.startOnLogin = shouldStartOnLogin;
  saveSettings(settings);
});

ipcMain.handle('get-startup-preference', async (event) => {
  const settings = readSettings();
  return settings.startOnLogin || false; // Return the setting or false if not set
});

app.on('ready', () => {
  // On app ready, read the settings and apply them
  const settings = readSettings();
  
  // Assuming you have a function to create the window and you can pass the settings to it
  createSearchBarWindow(settings);
});

// Function to read settings
function readSettings() {
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath));
  } catch (error) {
    console.error('Failed to read settings:', error);
  }
  return settings;
}

// Function to save settings
function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// ---------------------------- Open on startup - End -----------------