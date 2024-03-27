const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let searchBarWindow;

function createSearchBarWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 1600; // Default = 600
    const windowHeight = 675; // Default = 70
    const x = Math.floor((width - windowWidth) / 2);
    const y = Math.floor((height - windowHeight) / 2);

    searchBarWindow = new BrowserWindow({
        title: 'Hyperbar',
        icon: path.join(__dirname, 'icon.png'),
        width: windowWidth,
        height: windowHeight,
        x: x,
        y: y,
        frame: false, // Default = false
        transparent: true, // Default = true
        alwaysOnTop: false, // Default = true
        resizable: true, // Default = false
        roundedCorners: true, // Default = true
        backgroundMaterial: 'acrylic', // Set vibrancy to acrylic for Windows
        vibrancy: 'acrylic', // Set vibrancy to acrylic for MacOS
        backgroundColor: '#00000000', // Transparent black
        webPreferences: {
            sandbox: false,
            preload: path.join(__dirname,'preload.js'),
            contextIsolation: true,
            spellcheck: true,
            nodeIntegration: false
          }
    });

    searchBarWindow.loadFile(path.join(__dirname, 'index.html'));

    // Hide the menu bar
    searchBarWindow.setMenuBarVisibility(false);
}

app.setUserTasks([
    {
      program: process.execPath,
      arguments: '--new-window',
      iconPath: process.execPath,
      iconIndex: 0,
      title: 'New Window',
      description: 'Create a new window'
    }
  ])

// Handle AI response from renderer process
ipcMain.on('ai-response', (event, response) => {
    // Send the AI response to the renderer process
    searchBarWindow.webContents.send('update-ai-response', response);
});

app.on('ready', () => {
    createSearchBarWindow();

    // Listen for 'close-search-bar-window' message from renderer process
    ipcMain.on('closehyper', () => {
        if (searchBarWindow) {
            searchBarWindow.close();
        }
    });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
