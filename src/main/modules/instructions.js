const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'config.json');

// Add the missing readSettings function if it doesn't exist elsewhere in your code
function readSettings() {
    try {
        const data = fs.readFileSync(settingsPath);
        return JSON.parse(data);
    } catch (error) {
        console.error('An error occurred while reading the settings:', error);
        return {}; // Return an empty object if there's an error
    }
}

function getInstructions() {
    const settings = readSettings();
    return settings.instructions || ""; // Return the instructions if they exist.
}

// If you have a function to save instructions, you should add it here
// Assuming you have one, it should look something like this:
function saveInstructions(instructions) {
    const settings = readSettings();
    settings.instructions = instructions; // Update instructions in the settings object
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8'); // Write the updated settings back to the file
}

// Export the functions related to instructions
module.exports = { getInstructions, saveInstructions };
