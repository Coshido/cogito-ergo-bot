const cron = require('node-cron');
const { Client } = require('discord.js');
const UserPreferences = require('../utils/user-preferences');
const { getCurrentWeekMonday, loadReservations } = require('../utils/reservation-utils');

class ReminderService {
    constructor(client) {
        this.client = client;
    }

    async sendReservationReminders() {
        const now = new Date();
        const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
        const currentHour = now.getHours();

        // Load all user preferences
        const preferences = await UserPreferences.loadPreferences();

        // Current week's Monday
        const currentWeek = getCurrentWeekMonday();
        const reservations = loadReservations();

        // Iterate through users with reminders enabled
        for (const [userId, userConfig] of Object.entries(preferences)) {
            const reminderConfig = userConfig.reminders;

            // Check if reminder is due
            if (!reminderConfig?.enabled || 
                reminderConfig.day !== currentDay || 
                reminderConfig.hour !== currentHour) {
                continue;
            }

            try {
                // Fetch user
                const user = await this.client.users.fetch(userId);

                // Get user's current reservations
                const userReservations = reservations.weekly_reservations[currentWeek]?.[userId];

                // Prepare reminder message
                let reminderMessage = '';

                if (reminderConfig.type === 'unreserved' || reminderConfig.type === 'both') {
                    if (!userReservations || userReservations.items.length === 0) {
                        reminderMessage += "⚠️ You haven't made any reservations for this week's raid. Consider reserving your items soon!\n";
                    }
                }

                if (reminderConfig.type === 'current' || reminderConfig.type === 'both') {
                    if (userReservations && userReservations.items.length > 0) {
                        reminderMessage += "📋 Your current raid reservations:\n";
                        userReservations.items.forEach((item, index) => {
                            reminderMessage += `${index + 1}. ${item.name} (from ${item.boss})\n`;
                        });
                    }
                }

                // Send reminder if there's a message
                if (reminderMessage) {
                    await user.send(reminderMessage);
                }
            } catch (error) {
                console.error(`Error sending reminder to user ${userId}:`, error);
            }
        }
    }

    startReminderScheduler() {
        // Run every hour to check for reminders
        cron.schedule('0 * * * *', () => {
            this.sendReservationReminders();
        });
    }
}

module.exports = ReminderService;
