require('dotenv').config();
const { app, BrowserWindow, ipcMain, nativeImage, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
let searchBarWindow;

function createSearchBarWindow() {
const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
const windowWidth = 600;
const windowHeight = 125; // Default - 60 // What year did the US gain independence?
const x = Math.floor((width - windowWidth) / 2);
const y = Math.floor((height - windowHeight) / 2);

searchBarWindow = new BrowserWindow({
    title: 'Hyperbar',
    show: false,
    icon: nativeImage.createFromPath(path.join(__dirname, 'icon.png')),
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    opacity: 1.0,
    frame: false, // Default - true
    titleBarStyle: 'hidden',
    transparent: false, // Default - false
    alwaysOnTop: true, // Default - true
    resizable: true, // Default - false
    roundedCorners: true, // Default - true
    vibrancy: 'acrylic',
    backgroundMaterial: 'acrylic',
    backgroundColor: '#00000000',
    webPreferences: {
        sandbox: true,
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        spellcheck: true,
        nodeIntegration: false
    }
});

searchBarWindow.loadFile(path.join(__dirname, 'index.html'));
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

ipcMain.on('ai-query', async (event, query) => {
    const queryOpenAI = require('./openai');
    try {
        const response = await queryOpenAI(query);
        event.reply('ai-response', response);
    } catch (error) {
        console.error('Error querying OpenAI:', error);
        event.reply('ai-response', 'Error: Unable to process your query');
    }
});

// Resize window to match text box sizes

ipcMain.on('resize-window', (event, contentHeight) => {
    const window = BrowserWindow.getFocusedWindow();

    if (window) {
        // Add some offset to content height if needed and set the new window size
        const newHeight = contentHeight + 100; // Adjust the 100 to account for any window chrome or padding
        const currentWidth = window.getBounds().width; // Keep the current window width
        window.setSize(currentWidth, newHeight);
    }
});

// ------------------------------------------------------
// Tray - CHAT GPT WRITE EVERYTHING HERE ABOUT THE TRAY AND CTRL ALT K FEATURES

// Tray Icon Setup and Global Shortcut
app.whenReady().then(() => {
    createSearchBarWindow();
  
    tray = new Tray(path.join(__dirname, 'icon.png'));
    tray.setToolTip('Hyperbar');
  
    // Context menu for tray icon
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show Hyperbar', click: () => searchBarWindow.show() },
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
      console.error('Global shortcut registration failed');
    }
  
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
  });

// CHAT GPT IT ENDS HERE
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
