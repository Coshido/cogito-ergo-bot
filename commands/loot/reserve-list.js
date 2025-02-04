const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ImageComposer = require('../../utils/image-composer');
const { AttachmentBuilder } = require('discord.js');

// Also need these helper functions
function getCurrentWeekMonday() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
}

function loadReservations() {
    const reservationsPath = path.join(__dirname, '../../database/reservations.json');
    if (!fs.existsSync(reservationsPath)) {
        return { weekly_reservations: {} };
    }
    return JSON.parse(fs.readFileSync(reservationsPath, 'utf8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-list')
        .setDescription('Show your current week reservations'),

    async execute(interaction) {
        const currentWeek = getCurrentWeekMonday();
        const reservations = loadReservations();
        const userId = interaction.user.id;

        // Check if user has any reservations this week
        const userReservations = reservations.weekly_reservations[currentWeek]?.[userId] || [];
        if (userReservations.length === 0) {
            return await interaction.reply({
                content: 'You have no reservations for this week!',
                ephemeral: true
            });
        }

        // Show current reservations
        const reservationImage = await ImageComposer.createReservationImage(userReservations);
        const attachment = new AttachmentBuilder(reservationImage, { name: 'current-reservations.png' });

        const wowheadLinks = userReservations
            .map((item, index) => `${index + 1}- [${item.name}](${item.wowhead_url})`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Your Current Reservations')
            .setImage('attachment://current-reservations.png')
            .setDescription(`**Link su WowHead**\n${wowheadLinks}`);

        await interaction.reply({
            embeds: [embed],
            files: [attachment],
            ephemeral: true
        });
    }
}; 