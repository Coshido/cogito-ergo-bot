const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ImageComposer = require('../../utils/image-composer');
const { getCurrentWeekMonday, loadReservations, saveReservations } = require('../../utils/reservation-utils');
const { createItemSelectMenu } = require('../../utils/discord-utils');
const { isRaider } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve')
        .setDescription('Reserve items from the current raid'),

    async execute(interaction) {
        // Check if user is a raider
        if (!isRaider(interaction.member)) {
            return interaction.reply({
                content: 'Only Raiders can make item reservations.',
                ephemeral: true
            });
        }

        const currentWeek = getCurrentWeekMonday();
        let reservations = loadReservations();
        const userId = interaction.user.id;

        // Ensure weekly reservations structure exists
        if (!reservations.weekly_reservations) {
            reservations.weekly_reservations = {};
        }
        if (!reservations.weekly_reservations[currentWeek]) {
            reservations.weekly_reservations[currentWeek] = {};
        }

        // Get or initialize user's reservation data
        const userData = reservations.weekly_reservations[currentWeek][userId] || {
            character_name: null,
            items: []
        };

        // Check if user has reached max reservations
        if (userData.items && userData.items.length >= 2) {
            const reservationImage = await ImageComposer.createReservationImage(userData.items);
            const attachment = new AttachmentBuilder(reservationImage, { name: 'current-reservations.png' });

            const wowheadLinks = userData.items
                .map((item, index) => `${index + 1}- [${item.name}](${item.wowhead_url})`)
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Maximum Reservations Reached')
                .setImage('attachment://current-reservations.png')
                .setDescription(
                    `You have already reserved 2 items this week for character **${userData.character_name || 'Unknown'}**!\n\n` +
                    `**Link su WowHead**\n${wowheadLinks}`
                );

            return interaction.reply({
                embeds: [embed],
                files: [attachment],
                ephemeral: true
            });
        }

        // Read raid loot data
        let raidData;
        try {
            raidData = JSON.parse(fs.readFileSync(
                path.join(__dirname, '../../database/raid-loot.json'),
                'utf8'
            ));
        } catch (error) {
            console.error('Failed to read raid loot data:', error);
            return interaction.reply({
                content: 'Unable to load raid loot data. Please contact an administrator.',
                ephemeral: true
            });
        }

        // Prepare interaction state
        const userState = {
            selectedItems: [],
            currentStep: 1,
            characterName: null
        };

        // Create character name input button
        const characterButton = new ButtonBuilder()
            .setCustomId('set_character')
            .setLabel('Set Character Name')
            .setStyle(ButtonStyle.Primary);

        const bossSelect = new StringSelectMenuBuilder()
            .setCustomId('boss_select')
            .setPlaceholder('Select a boss')
            .setDisabled(true)
            .addOptions(
                raidData.bosses.map(boss => ({
                    label: boss.name,
                    value: boss.id.toString(),
                    description: `Select loot from ${boss.name}`
                }))
            );

        const buttonRow = new ActionRowBuilder().addComponents(characterButton);
        const selectRow = new ActionRowBuilder().addComponents(bossSelect);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`${raidData.raid} - Loot Reservation`)
            .setDescription(`First, set your character name, then select a boss to view their loot table.\nYou can reserve up to 2 items per week.\nYou have ${2 - (userData.items?.length || 0)} reservations remaining.`)
            .setFooter({ text: `Step ${userState.currentStep} of 3: Character Selection` });

        const initialMessage = await interaction.reply({
            embeds: [embed],
            components: [buttonRow, selectRow],
            ephemeral: true,
            fetchReply: true
        });

        // Create collectors for the entire flow
        const filter = i => i.user.id === interaction.user.id;
        const collector = initialMessage.createMessageComponentCollector({ 
            filter, 
            time: 300000 
        });

        collector.on('collect', async i => {
            try {
                if (i.customId === 'set_character') {
                    const modal = new ModalBuilder()
                        .setCustomId('character_name_modal')
                        .setTitle('Enter Character Name');

                    const characterNameInput = new TextInputBuilder()
                        .setCustomId('character_name')
                        .setLabel('Character Name')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Enter your character name')
                        .setRequired(true);

                    const firstActionRow = new ActionRowBuilder().addComponents(characterNameInput);
                    modal.addComponents(firstActionRow);

                    await i.showModal(modal);
                }
            } catch (error) {
                console.error('Collector error:', error);
                await i.reply({
                    content: 'An unexpected error occurred. Please try again.',
                    ephemeral: true
                });
                collector.stop();
            }
        });
    }
};