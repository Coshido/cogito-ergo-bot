const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ImageComposer = require('../../utils/image-composer');
const { AttachmentBuilder } = require('discord.js');
const { getCurrentWeekMonday, loadReservations, saveReservations, ensureCurrentWeekReservations } = require('../../utils/reservation-utils');
const { createItemSelectMenu } = require('../../utils/discord-utils');
const { isRaider } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve')
        .setDescription('Reserve items from the current raid'),

    async execute(interaction) {
        // Defer the initial reply to prevent timeout
        await interaction.deferReply({ ephemeral: true });

        try {
            // Check if user is a raider
            if (!isRaider(interaction.member)) {
                return interaction.editReply({
                    content: 'Only Raiders can make item reservations.',
                    ephemeral: true
                });
            }

            const currentWeek = getCurrentWeekMonday();
            const reservations = loadReservations();
            const userId = interaction.user.id;

            // Initialize user's weekly reservations if not exists
            ensureCurrentWeekReservations(reservations, userId);

            const userData = reservations.weekly_reservations[currentWeek][userId] || {
                character_name: null,
                discord_username: null,
                items: []
            };

            if (userData && userData.items.length >= 2) {
                // Create reservation image
                const reservationImage = await ImageComposer.createReservationImage(userData.items);
                const attachment = new AttachmentBuilder(reservationImage, { name: 'current-reservations.png' });

                const wowheadLinks = userData.items
                    .map((item, index) => `${index + 1}- [${item.name}](${item.wowhead_url})`)
                    .join('\n');

                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)  // Red color to indicate can't add more
                    .setTitle('Maximum Reservations Reached')
                    .setImage('attachment://current-reservations.png')
                    .setDescription(
                        `You have already reserved 2 items this week for character **${userData.character_name}**!\n\n` +
                        `**Link su WowHead**\n${wowheadLinks}`
                    );

                return await interaction.editReply({
                    embeds: [embed],
                    files: [attachment],
                    ephemeral: true
                });
            }

            // Read raid loot data with more detailed logging
            async function readRaidLootData() {
                try {
                    const raidLootPath = path.join(process.env.DATABASE_PATH || '/app/database', 'raid-loot.json');
                    console.log('Attempting to read raid loot file from:', raidLootPath);
                    
                    // Check file existence
                    const fileExists = fs.existsSync(raidLootPath);
                    console.log('File exists:', fileExists);

                    // Log directory contents
                    const databaseDir = path.dirname(raidLootPath);
                    const dirContents = fs.readdirSync(databaseDir);
                    console.log('Database directory contents:', dirContents);

                    // Read and parse file
                    const rawData = fs.readFileSync(raidLootPath, 'utf8');
                    console.log('Raw raid loot data:', rawData);

                    const raidData = JSON.parse(rawData);
                    console.log('Parsed Raid Data:', JSON.stringify(raidData, null, 2));
                    console.log('Number of bosses:', raidData.bosses.length);

                    return raidData;
                } catch (error) {
                    console.error('Error reading raid loot file:', error);
                    throw error;
                }
            }

            let raidData;
            try {
                raidData = await readRaidLootData();
            } catch (error) {
                console.error('FULL Error reading raid loot file:', error);
                
                // Ensure the directory exists
                const databaseDir = path.join(process.env.DATABASE_PATH || '/app/database');
                if (!fs.existsSync(databaseDir)) {
                    console.error('Database directory does not exist');
                    fs.mkdirSync(databaseDir, { recursive: true });
                }
                
                // Create a default raid loot file
                raidData = {
                    raid: "Default Raid",
                    bosses: [
                        { id: 1, name: "Boss1" },
                        { id: 2, name: "Boss2" }
                    ]
                };
                
                const defaultFilePath = path.join(process.env.DATABASE_PATH || '/app/database', 'raid-loot.json');
                console.log('Writing default raid loot file to:', defaultFilePath);
                fs.writeFileSync(defaultFilePath, JSON.stringify(raidData, null, 2));
            }

            // Store user's selection state
            const userState = {
                selectedItems: [],
                currentStep: 1,
                characterName: null  // Add this to store character name
            };

            // Create character name input button
            const characterButton = new ButtonBuilder()
                .setCustomId('set_character')
                .setLabel('Set Character Name')
                .setStyle(ButtonStyle.Primary);

            const bossSelect = new StringSelectMenuBuilder()
                .setCustomId('boss_select')
                .setPlaceholder('Select a boss')
                .setDisabled(true)  // Disabled until character name is set
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
                .setDescription(`First, set your character name, then select a boss to view their loot table.\nYou can reserve up to 2 items per week.\nYou have ${2 - userData.items.length} reservations remaining.`)
                .setFooter({ text: `Step ${userState.currentStep} of 3: Character Selection` });

            await interaction.editReply({
                embeds: [embed],
                components: [buttonRow, selectRow],
                ephemeral: true
            });

            // Create collectors for the entire flow
            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ 
                filter, 
                time: 300000,
                max: 10  // Limit the number of interactions to prevent potential memory issues
            });

            // Add error handling to the collector
            collector.on('error', async (error) => {
                console.error('Collector error:', error);
                await interaction.editReply({
                    content: 'An error occurred during the reservation process. Please try again.',
                    components: [],
                    ephemeral: true
                });
                collector.stop('error');
            });

            collector.on('collect', async i => {
                try {
                    // Defer update to prevent interaction timeout
                    await i.deferUpdate().catch(err => {
                        console.warn('Deferred update failed:', err);
                    });

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

                        await i.showModal(modal).catch(err => {
                            console.error('Error showing modal:', err);
                            // If showing modal fails, try to edit the reply
                            return i.editReply({
                                content: 'Failed to open character name input. Please try again.',
                                ephemeral: true
                            });
                        });
                    }
                    else if (i.customId === 'boss_select') {
                        const selectedBoss = raidData.bosses.find(b => b.id.toString() === i.values[0]);
                        if (!selectedBoss) {
                            console.error('Boss not found:', i.values[0]);
                            return await i.reply({ content: 'Error: Boss not found', ephemeral: true });
                        }
                        userState.currentBoss = selectedBoss;
                        
                        // Create loot table image
                        const lootImage = await ImageComposer.createLootTable(selectedBoss.loot);
                        const attachment = new AttachmentBuilder(lootImage, { name: 'loot-table.png' });

                        // Create WowHead links list
                        const wowheadLinks = selectedBoss.loot
                            .map((item, index) => `${index + 1}- [${item.name}](${item.wowhead_url})`)
                            .join('\n');

                        const lootEmbed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`${selectedBoss.name}`)
                            .setDescription(`**Link su WowHead**\n${wowheadLinks}`)
                            .setImage('attachment://loot-table.png')
                            .setFooter({ text: `Step ${userState.currentStep} of 3: Item Selection` });

                        // Create item selection menu
                        const itemSelect = createItemSelectMenu(selectedBoss.loot, 'item_select');
                        
                        // Add back button
                        const backButton = new ButtonBuilder()
                            .setCustomId('back_to_bosses')
                            .setLabel('← Select Different Boss')
                            .setStyle(ButtonStyle.Secondary);

                        // Create two rows: one for the select menu, one for the back button
                        const selectRow = new ActionRowBuilder().addComponents(itemSelect);
                        const buttonRow = new ActionRowBuilder().addComponents(backButton);

                        await i.update({
                            embeds: [lootEmbed],
                            files: [attachment],
                            components: [selectRow, buttonRow],
                        });
                    }

                    // Add handler for back button
                    else if (i.customId === 'back_to_bosses') {
                        userState.currentStep = 1;
                        const embed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`${raidData.raid} - Loot Reservation`)
                            .setDescription(`First, set your character name, then select a boss to view their loot table.\nYou can reserve up to 2 items per week.\nYou have ${2 - userData.items.length} reservations remaining.`)
                            .setFooter({ text: `Step ${userState.currentStep} of 3: Character Selection` });

                        await i.update({
                            embeds: [embed],
                            components: [buttonRow, selectRow],
                            files: []  // Remove any previous images
                        });
                    }
                    // Add back the item selection handler
                    else if (i.customId === 'item_select') {
                        const selectedItem = userState.currentBoss.loot.find(item => item.id === i.values[0]);
                        
                        userState.selectedItems.push({
                            id: selectedItem.id,
                            name: selectedItem.name,
                            boss: userState.currentBoss.name,
                            type: selectedItem.type,
                            ilvl: selectedItem.ilvl,
                            icon: selectedItem.icon,
                            wowhead_url: selectedItem.wowhead_url,
                            character_name: userState.characterName  // Use the character name we got in step 1
                        });

                        // Create the next screen (either second item selection or confirmation)
                        if (userState.selectedItems.length < 2 && userData.items.length === 0) {
                            // Show boss selection again for second item
                            userState.currentStep = 2;
                            const newEmbed = new EmbedBuilder()
                                .setColor(0x0099FF)
                                .setTitle(`${raidData.raid} - Second Item Selection`)
                                .setDescription('Select a boss for your second item.\n\nFirst selection:\n' +
                                    `- ${selectedItem.name} from ${userState.currentBoss.name}`)
                                .setFooter({ text: `Step ${userState.currentStep} of 3: Boss Selection` });

                            await i.update({
                                embeds: [newEmbed],
                                components: [selectRow],
                                files: []
                            });
                        } else {
                            // Show confirmation screen
                            userState.currentStep = 3;
                            const confirmEmbed = new EmbedBuilder()
                                .setColor(0x0099FF)
                                .setTitle('Confirm Your Reservations')
                                .setDescription(
                                    `Please review and confirm your selections for character **${userState.characterName}**:`
                                )
                                .setImage('attachment://reservations.png')
                                .setFooter({ text: 'Step 3 of 3: Confirmation' });

                            const confirmButton = new ButtonBuilder()
                                .setCustomId('confirm_reservation')
                                .setLabel('Confirm Reservations')
                                .setStyle(ButtonStyle.Success);

                            const cancelButton = new ButtonBuilder()
                                .setCustomId('cancel_reservation')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Danger);

                            const confirmRow = new ActionRowBuilder()
                                .addComponents(confirmButton, cancelButton);

                            // Create reservation image
                            const reservationImage = await ImageComposer.createReservationImage(userState.selectedItems);
                            const attachment = new AttachmentBuilder(reservationImage, { name: 'reservations.png' });

                            await i.update({
                                embeds: [confirmEmbed],
                                components: [confirmRow],
                                files: [attachment]
                            });
                        }
                    }
                    // Add back the confirm/cancel handlers
                    else if (i.customId === 'confirm_reservation') {
                        // Save the reservations with character name at user level
                        reservations.weekly_reservations[currentWeek][userId] = {
                            character_name: userState.characterName,
                            items: userState.selectedItems.map(item => ({
                                id: item.id,
                                name: item.name,
                                boss: item.boss,
                                type: item.type,
                                ilvl: item.ilvl,
                                icon: item.icon,
                                wowhead_url: item.wowhead_url
                            }))
                        };
                        saveReservations(reservations);

                        // Create final image
                        const reservationImage = await ImageComposer.createReservationImage(userState.selectedItems);
                        const attachment = new AttachmentBuilder(reservationImage, { name: 'reservations.png' });

                        const finalEmbed = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle('Reservations Confirmed!')
                            .setImage('attachment://reservations.png')
                            .setDescription(
                                `Your items have been reserved for this week for character **${userState.characterName}**!\n\n` +
                                `**Link su WowHead**\n${userState.selectedItems.map((item, index) => 
                                    `${index + 1}- [${item.name}](${item.wowhead_url})`
                                ).join('\n')}`
                            );

                        await i.update({
                            embeds: [finalEmbed],
                            files: [attachment],
                            components: [],
                        });
                        collector.stop();
                    }
                    else if (i.customId === 'cancel_reservation') {
                        const cancelEmbed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('Reservations Cancelled')
                            .setDescription('Your item reservations have been cancelled.');

                        await i.update({
                            embeds: [cancelEmbed],
                            components: [],
                            files: []
                        });
                        collector.stop();
                    }
                } catch (error) {
                    console.error('Collector collect error:', error);
                    
                    // Attempt to handle the error gracefully
                    try {
                        await i.editReply({
                            content: 'An unexpected error occurred. Please try your reservation again.',
                            components: [],
                            ephemeral: true
                        }).catch(() => {});
                    } catch (editError) {
                        console.error('Error editing reply:', editError);
                    }
                    
                    collector.stop('error');
                }
            });

            // Add a timeout handler to clean up
            collector.on('end', async (collected, reason) => {
                console.log(`Collector ended. Reason: ${reason}`);
                
                try {
                    // If the interaction is still pending, try to edit the reply
                    await interaction.editReply({
                        content: 'Reservation process timed out. Please start over.',
                        components: [],
                        ephemeral: true
                    }).catch(err => {
                        console.warn('Failed to edit reply on collector end:', err);
                    });
                } catch (error) {
                    console.error('Error in collector end handler:', error);
                }
            });
        } catch (mainError) {
            console.error('Main execution error:', mainError);
            try {
                await interaction.editReply({
                    content: 'An unexpected error occurred. Please try again later.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Error sending error reply:', replyError);
            }
        }
    }
};