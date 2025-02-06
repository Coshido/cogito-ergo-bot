const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getCurrentWeekMonday, loadReservations, ensureCurrentWeekReservations } = require('../../utils/reservation-utils');
const { isRaidLeader } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-list')
        .setDescription('Show all current week reservations organized by boss'),

    async execute(interaction) {
        // Check if user is a raid leader
        if (!isRaidLeader(interaction.member)) {
            return interaction.reply({
                content: 'Only Raid Leaders can view the reservation list.',
                ephemeral: true
            });
        }

        const currentWeek = getCurrentWeekMonday();
        const reservations = loadReservations();
        ensureCurrentWeekReservations(reservations);
        const itemReservations = {};
        
        // Read raid loot data
        const raidData = JSON.parse(fs.readFileSync(
            path.join(__dirname, '../../database/raid-loot.json'),
            'utf8'
        ));

        // Initialize the map with all bosses and their items
        raidData.bosses.forEach(boss => {
            itemReservations[boss.name] = {};
            boss.loot.forEach(item => {
                itemReservations[boss.name][item.name] = [];
            });
        });

        // Fill in the reservations
        Object.entries(reservations.weekly_reservations[currentWeek] || {}).forEach(([userId, userData]) => {
            userData.items.forEach(item => {
                if (itemReservations[item.boss]?.[item.name]) {
                    itemReservations[item.boss][item.name].push({
                        userId: userId,
                        characterName: userData.character_name
                    });
                }
            });
        });

        // Create the embed description
        let description = '';
        
        const guild = interaction.guild;

        Object.entries(itemReservations).forEach(([bossName, items]) => {
            const bossItems = Object.entries(items)
                .filter(([_, reservers]) => reservers.length > 0)
                .map(([itemName, reservers]) => {
                    const reserversList = reservers
                        .map(r => {
                            const member = guild.members.cache.get(r.userId);
                            const username = member ? member.user.username : 'Unknown User';
                            return `  └ ${username} (${r.characterName})`;
                        })
                        .join('\n');
                    return `**${itemName}**\n${reserversList}`;
                });

            if (bossItems.length > 0) {
                description += `\n\`\`\`ansi\n\u001b[2;34m${bossName.toUpperCase()}\u001b[0m\n\`\`\`\n${bossItems.join('\n\n')}\n`;
            }
        });

        if (description === '') {
            description = 'No reservations for this week yet!';
        }

        const embed = new EmbedBuilder()
            .setColor('#87CEEB') // Set embed color to a subtle blue
            .setTitle('All Current Week Reservations')
            .setDescription(description)
            .setFooter({ text: `Week of ${currentWeek}` });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};