const fs = require('fs').promises;
const path = require('path');

class UserPreferences {
    static PREFERENCES_PATH = path.join(__dirname, '../database/user-preferences.json');

    static async loadPreferences() {
        try {
            const data = await fs.readFile(this.PREFERENCES_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, return empty object
            if (error.code === 'ENOENT') {
                return {};
            }
            throw error;
        }
    }

    static async savePreferences(preferences) {
        await fs.writeFile(this.PREFERENCES_PATH, JSON.stringify(preferences, null, 2));
    }

    static async setReminderPreferences(userId, preferences) {
        const allPreferences = await this.loadPreferences();
        allPreferences[userId] = {
            ...allPreferences[userId],
            reminders: {
                enabled: preferences.enabled || false,
                type: preferences.type || 'none', // 'none', 'unreserved', 'current', or 'both'
                day: preferences.day || null,
                hour: preferences.hour || null
            }
        };
        await this.savePreferences(allPreferences);
        return allPreferences[userId].reminders;
    }

    static async getReminderPreferences(userId) {
        const allPreferences = await this.loadPreferences();
        return allPreferences[userId]?.reminders || {
            enabled: false,
            type: 'none',
            day: null,
            hour: null
        };
    }
}

module.exports = UserPreferences;
