const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { getCurrentWeekMonday } = require('../../utils/reservation-utils');
const { isRaidLeader } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-clear')
        .setDescription('Clear all reservations for the current week (Raid Leaders only)'),

    async execute(interaction) {
        // Check if the user is a Raid Leader
        if (!await isRaidLeader(interaction.member)) {
            await interaction.reply({
                content: 'You do not have permission to clear reservations. Only Raid Leaders can use this command.',
                ephemeral: true
            });
            return;
        }

        try {
            // Path to the reservations file
            const reservationsPath = path.join(__dirname, '../../database/reservations.json');

            // Read the current reservations
            const reservationsData = require(reservationsPath);

            // Get the current week's date
            const currentWeek = getCurrentWeekMonday();

            // Remove reservations for the current week
            if (reservationsData.weekly_reservations && reservationsData.weekly_reservations[currentWeek]) {
                delete reservationsData.weekly_reservations[currentWeek];
            }

            // Write the updated data back to the file
            await fs.writeFile(reservationsPath, JSON.stringify(reservationsData, null, 2));

            // Create an embed to confirm the action
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Reservations Cleared')
                .setDescription(`All reservations for the week of ${currentWeek} have been cleared.`)
                .setFooter({ text: 'Action performed by a Raid Leader' });

            // Reply with the confirmation
            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error clearing reservations:', error);
            await interaction.reply({
                content: 'An error occurred while clearing reservations.',
                ephemeral: true
            });
        }
    }
};
