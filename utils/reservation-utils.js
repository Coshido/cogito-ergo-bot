const fs = require('fs');
const path = require('path');

function getCurrentWeekMonday() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
}

function loadReservations() {
    const reservationsPath = path.join(__dirname, '../database/reservations.json');
    if (!fs.existsSync(reservationsPath)) {
        return { weekly_reservations: {} };
    }
    return JSON.parse(fs.readFileSync(reservationsPath, 'utf8'));
}

function saveReservations(reservations) {
    const reservationsPath = path.join(__dirname, '../database/reservations.json');
    fs.writeFileSync(reservationsPath, JSON.stringify(reservations, null, 2));
}

function ensureCurrentWeekReservations(userId) {
    const reservations = loadReservations();
    const currentWeek = getCurrentWeekMonday();

    // If current week doesn't exist, create it with carried over reservations
    if (!reservations.weekly_reservations[currentWeek]) {
        // Get the previous week's reservations
        const previousWeeks = Object.keys(reservations.weekly_reservations)
            .sort((a, b) => new Date(b) - new Date(a));
        
        if (previousWeeks.length > 0) {
            const latestWeek = previousWeeks[0];
            
            // Create a new entry for the current week with carried over reservations
            reservations.weekly_reservations[currentWeek] = 
                JSON.parse(JSON.stringify(reservations.weekly_reservations[latestWeek]));
        } else {
            // If no previous reservations, create an empty object
            reservations.weekly_reservations[currentWeek] = {};
        }

        // Save the updated reservations
        saveReservations(reservations);
    }

    // Ensure the specific user has an entry for the current week
    if (userId && !reservations.weekly_reservations[currentWeek][userId]) {
        reservations.weekly_reservations[currentWeek][userId] = {
            character_name: null,
            discord_username: null,
            items: []
        };
        saveReservations(reservations);
    }

    return reservations;
}

module.exports = {
    getCurrentWeekMonday,
    loadReservations,
    saveReservations,
    ensureCurrentWeekReservations
};