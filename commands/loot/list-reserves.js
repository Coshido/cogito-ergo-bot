const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Helper function to get the Monday of the current week
function getCurrentWeekMonday() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
}

// Helper function to load reservations
function loadReservations() {
    const reservationsPath = path.join(__dirname, '../../database/reservations.json');
    if (!fs.existsSync(reservationsPath)) {
        return { weekly_reservations: {} };
    }
    return JSON.parse(fs.readFileSync(reservationsPath, 'utf8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-reserves')
        .setDescription('List all current raid item reservations'),

    async execute(interaction) {
        const currentWeek = getCurrentWeekMonday();
        const reservations = loadReservations();
        const weeklyReservations = reservations.weekly_reservations[currentWeek] || {};

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Current Week Raid Reservations')
            .setDescription('Here are all the current item reservations for this week:');

        // Group reservations by boss
        const bossList = {};
        for (const [userId, items] of Object.entries(weeklyReservations)) {
            for (const item of items) {
                if (!bossList[item.boss]) {
                    bossList[item.boss] = [];
                }
                const user = await interaction.client.users.fetch(userId);
                bossList[item.boss].push({
                    user: user.username,
                    item: item
                });
            }
        }

        // Add each boss as a field
        for (const [boss, items] of Object.entries(bossList)) {
            const itemList = items.map(reservation => 
                `${reservation.user}: ${reservation.item.name} (${reservation.item.type})`
            ).join('\n');
            
            embed.addFields({
                name: boss,
                value: itemList || 'No reservations',
                inline: false
            });
        }

        if (Object.keys(bossList).length === 0) {
            embed.setDescription('No reservations have been made for this week yet.');
        }

        await interaction.reply({
            embeds: [embed],
            ephemeral: false // Make this visible to everyone
        });
    },
};
