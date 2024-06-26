const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Define the path to config.json file

const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'config.json');

// Function to save the API key to config.json
function saveApiKey(apiKey) {
    // Load existing settings or initialize an empty object if the file doesn't exist
    let settings = {};
    if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    // Update the API key in the settings object
    settings.OPENAI_API_KEY = apiKey;
    // Write the updated settings back to the file
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

// Function to retrieve the API key from config.json
function getApiKey() {
    // Check if config.json
    if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        return settings.OPENAI_API_KEY || ''; // Return the API key or an empty string if not found
    }
    // Return an empty string if config.json does not exist
    return '';
}

module.exports = { saveApiKey, getApiKey };
