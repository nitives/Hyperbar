require("dotenv").config();
const {
  app,
  BrowserWindow,
  ipcMain,
  nativeImage,
  nativeTheme,
  globalShortcut,
  Tray,
  Menu,
  systemPreferences,
  MenuItem,
  shell,
} = require("electron");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { saveApiKey, getApiKey } = require("./modules/apiKey.js");
const queryOpenAI = require("./modules/openai.js");

const userDataPath = app.getPath("userData");
const settingsPath = path.join(userDataPath, "config.json");

let searchBarWindow;
let SettingsWindow;

function createSearchBarWindow() {
  const { width, height } =
    require("electron").screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 600;
  const windowHeight = 60; // Default - 125 or 60 | What year did the US gain independence?
  const x = Math.floor((width - windowWidth) / 2);
  const y = Math.floor((height - windowHeight) / 2);

  searchBarWindow = new BrowserWindow({
    title: "Hyperbar",
    show: false,
    icon: nativeImage.createFromPath(
      path.join(__dirname, "../assets/icon.png")
    ),
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    opacity: 1.0,
    frame: false, // Default - true
    titleBarStyle: "hidden",
    transparent: false, // Default - false
    alwaysOnTop: false, // Default - true
    resizable: true, // Default - false
    roundedCorners: true, // Default - true
    vibrancy: "acrylic",
    backgroundMaterial: "acrylic",
    backgroundColor: "#00000000",
    webPreferences: {
      sandbox: true,
      preload: path.join(__dirname, "./preload.js"),
      contextIsolation: true,
      spellcheck: true,
      nodeIntegration: false,
    },
  });

  searchBarWindow.loadFile(path.join(__dirname, "../front/index.html"));
  searchBarWindow.setMenuBarVisibility(false);

  // Window blur and animation for focused window ------------------------------------------

  searchBarWindow.on("blur", () => {
    searchBarWindow.setBackgroundColor("#1c1c1c");
    searchBarWindow.setVibrancy(null); // Optional: Disable vibrancy
    searchBarWindow.setBackgroundMaterial("none"); // Re-enable the acrylic effect
  });

  searchBarWindow.on("focus", () => {
    searchBarWindow.setBackgroundColor("#00000033"); // Transparent
    searchBarWindow.setVibrancy("acrylic"); // Re-enable the acrylic effect
    searchBarWindow.setBackgroundMaterial("acrylic"); // Re-enable the acrylic effect
  });

  const settings = readSettings();
  if (settings.alwaysOnTop) {
    searchBarWindow.setAlwaysOnTop(true);
  }
}
// ---------------------------------------------------------------------------------------

// SAVE TO CONFIG FILE

// Toggle Transparency

// Toggle Always on Top
ipcMain.on("toggle-always-on-top", (event, isEnabled) => {
  searchBarWindow.setAlwaysOnTop(isEnabled);
  const settings = readSettings();
  settings.alwaysOnTop = isEnabled;
  saveSettings(settings);
});

ipcMain.handle("get-always-on-top-setting", () => {
  const settings = readSettings();
  return settings.alwaysOnTop || false;
});

// ---------------------------------------------------------------------------------------

function ensureSettingsFileExists() {
  // Check if the settings file exists, and create it with default values if it doesn't
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify({}));
    console.log("Settings file does not exists");
  }
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath));
  } catch (error) {
    return {}; // If file does not exist or error occurs, return an empty object
  }
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// --------------------------------------------------------------------------------------- End of settings file

// Resize window to match text box sizes
ipcMain.on("resize-window", (event, windowId, contentHeight) => {
  const targetWindow = searchBarWindow;
  if (targetWindow) {
    if (targetWindow.title === "Settings") {
      return;
    } // Prevent resizing if this is the settings window
    const newHeight = contentHeight + 76; // Adjust padding if needed
    const currentWidth = targetWindow.getBounds().width;
    targetWindow.setSize(currentWidth, newHeight);
  }
});

// Tray Icon Setup and Global Shortcut
app.whenReady().then(() => {
  createSearchBarWindow();

  tray = new Tray(path.join(__dirname, "../assets/icon.png"));
  tray.setToolTip("Hyperbar");

  // Context menu for tray icon
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show Hyperbar", click: () => searchBarWindow.show() },
    {
      label: "Open Settings",
      click: () => {
        if (!SettingsWindow) {
          createSettingsWindow();
        } // Create the settings window if it does not exist
        SettingsWindow.show(); // Show the settings window
      },
    },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
        searchBarWindow.close();
        if (SettingsWindow) {
          SettingsWindow.close();
        }
        app.exit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Clicking the tray icon shows the window
  tray.on("click", () => {
    searchBarWindow.isVisible()
      ? searchBarWindow.hide()
      : searchBarWindow.show();
  });

  // Global shortcut to toggle the window visibility --------------------------------------
  const ret = globalShortcut.register("Control+Alt+K", () => {
    if (searchBarWindow.isMinimized()) searchBarWindow.restore();
    else
      searchBarWindow.isVisible()
        ? searchBarWindow.hide()
        : searchBarWindow.show();
  });
  if (!ret) {
    console.error("Global shortcut registration failed - Control+Alt+K");
  }

  searchBarWindow.on("focus", () => {
    globalShortcut.register("Esc", () => {
      if (searchBarWindow.isVisible()) {
        searchBarWindow.hide();
      }
    });
  });
  searchBarWindow.on("blur", () => {
    globalShortcut.unregister("Esc");
  });

  searchBarWindow.on("focus", () => {
    globalShortcut.register("Ctrl+S", () => {
      if (searchBarWindow.isFocused()) {
        if (!SettingsWindow) {
          createSettingsWindow();
        }
        SettingsWindow.show();
      }
    });
  });
  searchBarWindow.on("blur", () => {
    globalShortcut.unregister("Ctrl+S");
  });

  searchBarWindow.on("focus", () => {
    globalShortcut.register("Ctrl+Q", () => {
      if (searchBarWindow.isVisible() && searchBarWindow.isFocused()) {
        app.exit();
      }
    });
  });
  searchBarWindow.on("blur", () => {
    globalShortcut.unregister("Ctrl+Q");
  });

  // ----------------------------------------------------------------

  // Hide the window when it's closed instead of quitting the app
  searchBarWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      searchBarWindow.hide();
    }
  });

  // Clean up on app quit
  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
    if (tray) tray.destroy();
  });

  // -------------------------- Theme / Accent Color CSS --------------------------
  // - Here is adding the Theme / Accent Color of the users Windows computer to the css palette
  searchBarWindow.webContents.on("did-finish-load", () => {
    const accentColor = systemPreferences.getAccentColor(); // RGBA hex
    searchBarWindow.webContents.send("set-accent-color", accentColor);
  });

  const settings = readSettings();
  if (settings.shortcuts) {
    registerShortcuts(settings.shortcuts);
  }

  ensureSettingsFileExists();
});
// ------------------------------------------------------

ipcMain.on("typing-started", (event) => {
  event.sender.send("typing-started");
});

ipcMain.on("typing-ended", (event) => {
  event.sender.send("typing-ended");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("hide-window", () => {
  if (searchBarWindow) {
    searchBarWindow.hide();
  }
});

ipcMain.handle("theme:dark", () => {
  nativeTheme.themeSource = "dark"; // Set theme to dark
  saveUserThemePreference("dark");
});

ipcMain.handle("theme:light", () => {
  nativeTheme.themeSource = "light"; // Set theme to light
  saveUserThemePreference("light");
});

ipcMain.handle("theme:system", () => {
  nativeTheme.themeSource = "system"; // Follow the system theme
  saveUserThemePreference("system");
});

function saveUserThemePreference(theme) {
  const settings = readSettings();
  settings.themePreference = theme;
  saveSettings(settings);
}

function isValidShortcut(shortcut) {
  return typeof shortcut === "string" && shortcut.trim() !== "";
}

ipcMain.on("save-shortcut", (event, action, shortcut) => {
  const settings = readSettings();
  settings.shortcuts = settings.shortcuts || {};
  settings.shortcuts[action] = shortcut;
  saveSettings(settings);

  try {
    globalShortcut.unregisterAll();
    registerShortcuts(settings.shortcuts);
    event.reply("shortcut-saved", true);
  } catch (error) {
    console.error("Failed to register shortcuts:", error);
    event.reply("shortcut-error", "Failed to register shortcut");
  }
});

function registerShortcuts(shortcuts) {
  Object.keys(shortcuts).forEach((action) => {
    const shortcut = shortcuts[action];
    if (
      !globalShortcut.register(shortcut, () => {
        if (action === "openHyperbar") searchBarWindow.show();
      })
    ) {
      console.log(`Failed to register shortcut: ${shortcut}`);
    }
  });
}
// ---------------------------------------------- Settings ----------------------------------------------
// - Here you'll be able to click the icon / svg button to open the settings

function createSettingsWindow() {
  // Retrieve the dimensions of the screen
  const { width, height } =
    require("electron").screen.getPrimaryDisplay().workAreaSize;
  // Define the dimensions for the settings window
  const settingsWindowWidth = 1100; // Example width for settings window
  const settingsWindowHeight = 700; // Example height for settings window
  const x = Math.floor((width - settingsWindowWidth) / 2);
  const y = Math.floor((height - settingsWindowHeight) / 2);

  // Create a new BrowserWindow for the settings
  SettingsWindow = new BrowserWindow({
    title: "Settings",
    width: settingsWindowWidth,
    height: settingsWindowHeight,
    x: x,
    y: y,
    icon: nativeImage.createFromPath(
      path.join(__dirname, "../assets/icon.png")
    ),
    opacity: 1.0,
    frame: false, // Default - true
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    minimizable: false,
    maximizable: false,
    transparent: false, // Default - false
    alwaysOnTop: false, // Default - true
    resizable: true, // Default - false
    roundedCorners: true, // Default - true
    vibrancy: "acrylic",
    backgroundMaterial: "acrylic",
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the HTML file for the settings window
  SettingsWindow.loadFile(path.join(__dirname, "../front/settings.html"));

  // Hide the window when it's closed, instead of quitting the application
  SettingsWindow.on("close", (event) => {
    event.preventDefault();
    SettingsWindow.hide();
  });

  SettingsWindow.on("blur", () => {
    SettingsWindow.setBackgroundColor("#1c1c1c"); //
    SettingsWindow.setVibrancy(null); // Optional: Disable vibrancy
    SettingsWindow.setBackgroundMaterial("none"); // Re-enable the acrylic effect
  });

  SettingsWindow.on("focus", () => {
    SettingsWindow.setBackgroundColor("#00000033"); // Transparent
    SettingsWindow.setVibrancy("acrylic"); // Re-enable the acrylic effect
    SettingsWindow.setBackgroundMaterial("acrylic"); // Re-enable the acrylic effect
  });

  SettingsWindow.webContents.on("did-finish-load", () => {
    const accentColor = systemPreferences.getAccentColor(); // RGBA hex
    SettingsWindow.webContents.send("set-accent-color", accentColor);
  });

  SettingsWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url); // Open URL in user's browser.
    return { action: "deny" }; // Prevent the app from opening the URL.
  });
}

// --------------------------- API Key Input ---------------------------

// Handle saving API key from settings
ipcMain.on("save-api-key", (event, apiKey) => {
  saveApiKey(apiKey); // Save the API key using the function from apiKey.js
  event.reply("api-key-saved", true); // Send a confirmation back to the renderer process

  // console.log(`API Key Saved: ${apiKey}`);
  event.reply("api-key-status", {
    valid: true,
    message: "API Key saved successfully!",
  });
});

ipcMain.on("ai-query", async (event, query) => {
  const apiKey = getApiKey(); // Fetch the API key using the function from apiKey.js
  try {
    // Now pass the apiKey to the queryOpenAI function
    const response = await queryOpenAI(query, apiKey);
    event.reply("ai-response", response);
  } catch (error) {
    console.error("Error querying OpenAI:", error);
    event.reply("ai-response", "Error: Unable to process your query");
  }
});

// ----------------------------
// ---------------------------- API Key Input End ----------------------

// --------------------------- Instructions - Start ---------------------------

// Function to save instructions
function saveInstructions(instructions) {
  let settings = readSettings();
  settings.instructions = instructions;
  saveSettings(settings);
}

ipcMain.on("save-instructions", (event, instructions) => {
  saveInstructions(instructions);
  // You can reply back to renderer process if needed
  event.reply("instructions-saved", true);
});

// Function to get instructions
function getInstructions() {
  let settings = readSettings();
  return settings.instructions || ""; // Return the instructions or an empty string if not set
}

ipcMain.handle("get-instructions", async (event) => {
  return getInstructions();
});

ipcMain.on("save-instructions", (event, instructions) => {
  // Call function to save the instructions
  saveInstructions(instructions);
  event.reply("instructions-status", {
    success: true,
    message: "Instructions saved successfully!",
  });
});

// Add a function to save instructions
function saveInstructions(instructions) {
  const settings = readSettings(); // This function should read the current config.json
  settings.instructions = instructions; // Add or update instructions in the settings object
  saveSettings(settings); // This function should save the updated settings object back to config.json
}
// ---------------------------- Instructions - End ----------------------

ipcMain.on("open-settings", (event) => {
  if (!SettingsWindow) {
    createSettingsWindow();
  }
  SettingsWindow.show();
});

// Custom Close Button
ipcMain.on("close-settings", (event) => {
  if (SettingsWindow && !SettingsWindow.isDestroyed()) {
    SettingsWindow.close();
  }
});

// ---------------------------------------------- Settings - End ----------------------------------------------

// --------------------------- Open on startup -------------------------
ipcMain.on("toggle-startup", (event, shouldStartOnLogin) => {
  app.setLoginItemSettings({
    openAtLogin: shouldStartOnLogin,
  });

  // Additionally, save the preference to the settings file
  const settings = readSettings();
  settings.startOnLogin = shouldStartOnLogin;
  saveSettings(settings);
});

ipcMain.handle("get-startup-preference", () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle("get-login-settings", () => {
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

app.on("ready", () => {
  // On app ready, read the settings and apply them
  const settings = readSettings();
  if (settings.themePreference) {
    nativeTheme.themeSource = settings.themePreference;
  } // Assuming you have a function to create the window and you can pass the settings to it
  createSearchBarWindow(settings);

  if (settings.alwaysOnTop) {
    searchBarWindow.setAlwaysOnTop(settings.alwaysOnTop);
  }
});

// Function to read settings
function readSettings() {
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath));
  } catch (error) {
    console.error("Failed to read settings:", error);
  }
  return settings;
}

// Function to save settings
function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

// ---------------------------- Open on startup - End -----------------
