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
        // Check if user is a raider
        if (!await isRaider(interaction.member)) {
            return interaction.reply({
                content: 'Only Raiders can make item reservations.',
                ephemeral: true
            });
        }

        // Defer the reply to handle potential processing delays
        await interaction.deferReply({ ephemeral: true });

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
            });
        }

        // Read raid loot data
        const raidData = JSON.parse(fs.readFileSync(
            path.join(__dirname, '../../database/raid-loot.json'),
            'utf8'
        ));

        // Store user's selection state
        const userState = {
            selectedItems: [],
            currentStep: 1,
            characterName: null,  // Add this to store character name
            currentBoss: null
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

        const initialMessage = await interaction.editReply({
            embeds: [embed],
            components: [buttonRow, selectRow],
        });

        // Create collectors for the entire flow
        const filter = i => i.user.id === interaction.user.id;
        const collector = initialMessage.createMessageComponentCollector({ filter, time: 300000 });

        // Add a client-level modal submit handler
        interaction.client.on('interactionCreate', async (modalInteraction) => {
            // Ensure it's a modal submission and for the right user
            if (!modalInteraction.isModalSubmit() || 
                modalInteraction.customId !== 'character_name_modal' || 
                modalInteraction.user.id !== interaction.user.id) return;

            try {
                console.log('Modal submitted successfully');
                const characterName = modalInteraction.fields.getTextInputValue('character_name');
                console.log('Character name:', characterName);

                // Enable boss selection
                bossSelect.setDisabled(false);
                const updatedSelectRow = new ActionRowBuilder().addComponents(bossSelect);

                // Update the button to show the character name
                characterButton
                    .setLabel(`Character: ${characterName}`)
                    .setStyle(ButtonStyle.Success);
                const updatedButtonRow = new ActionRowBuilder().addComponents(characterButton);

                await modalInteraction.update({
                    components: [updatedButtonRow, updatedSelectRow]
                });

                // Store the character name in userState
                userState.characterName = characterName;
            } catch (error) {
                console.error('Error handling modal submission:', error);
                await modalInteraction.reply({
                    content: `Something went wrong: ${error.message}`,
                    ephemeral: true
                });
            }
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
                else if (i.customId === 'boss_select') {
                    console.log('Boss selected:', i.values[0]);
                    
                    // Defer the update to handle potential processing delays
                    await i.deferUpdate();

                    const selectedBoss = raidData.bosses.find(b => b.id.toString() === i.values[0]);
                    
                    if (!selectedBoss) {
                        console.error('Boss not found:', i.values[0]);
                        return await i.reply({ 
                            content: 'Error: Boss not found', 
                            ephemeral: true 
                        });
                    }

                    console.log('Selected boss details:', selectedBoss);
                    userState.currentBoss = selectedBoss;
                    
                    // Create loot table image
                    const cachedLootImage = await ImageComposer.loadCachedBossLootImage(selectedBoss.name);
                    const lootImage = cachedLootImage || await ImageComposer.createLootTable(selectedBoss.loot);
                    const attachment = new AttachmentBuilder(lootImage, { name: 'loot-table.png' });

                    // Create WowHead links list
                    const wowheadLinks = selectedBoss.loot
                        .map((item, index) => `${index + 1}- [${item.name}](${item.wowhead_url})`)
                        .join('\n');

                    const lootEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`${selectedBoss.name}`)
                        .setDescription(
                            `**Loot Table**\n\n` +
                            `**WowHead Links**\n${wowheadLinks}`
                        )
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

                    await i.editReply({
                        embeds: [lootEmbed],
                        files: [attachment],
                        components: [selectRow, buttonRow],
                    });
                }
                else if (i.customId === 'item_select') {
                    console.log('Item selected:', i.values[0]);
                    console.log('Current boss:', userState.currentBoss);

                    // Find the selected item from the current boss's loot
                    const selectedItem = userState.currentBoss.loot.find(item => item.id === i.values[0]);
                    
                    if (!selectedItem) {
                        console.error('Item not found:', i.values[0]);
                        return await i.reply({ 
                            content: 'Error: Item not found', 
                            ephemeral: true 
                        });
                    }

                    console.log('Selected item details:', selectedItem);
                    
                    // Add the selected item to user's reservations
                    userState.selectedItems.push({
                        id: selectedItem.id,
                        name: selectedItem.name,
                        boss: userState.currentBoss.name,
                        type: selectedItem.type,
                        ilvl: selectedItem.ilvl,
                        icon: selectedItem.icon,
                        wowhead_url: selectedItem.wowhead_url,
                        character_name: userState.characterName
                    });

                    console.log('Current selected items:', userState.selectedItems);

                    // Determine next steps based on current reservations
                    if (userState.selectedItems.length < 2 && userData.items.length === 0) {
                        // Show boss selection again for second item
                        userState.currentStep = 2;
                        const newEmbed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle(`${raidData.raid} - Second Item Selection`)
                            .setDescription('Select a boss for your second item.\n\nFirst selection:\n' +
                                `- ${selectedItem.name} from ${userState.currentBoss.name}`)
                            .setFooter({ text: `Step ${userState.currentStep} of 3: Boss Selection` });

                        // Recreate the original boss selection rows
                        const bossSelect = new StringSelectMenuBuilder()
                            .setCustomId('boss_select')
                            .setPlaceholder('Select a boss')
                            .addOptions(
                                raidData.bosses.map(boss => ({
                                    label: boss.name,
                                    value: boss.id.toString(),
                                    description: `Select loot from ${boss.name}`
                                }))
                            );
                        const selectRow = new ActionRowBuilder().addComponents(bossSelect);

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
                                `Please review and confirm your selections for character **${userState.characterName}**:\n\n` +
                                userState.selectedItems.map((item, index) => 
                                    `${index + 1}. ${item.name} from ${item.boss}`
                                ).join('\n')
                            )
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
                else if (i.customId === 'back_to_bosses') {
                    // Defer the update to handle potential processing delays
                    await i.deferUpdate();

                    // Recreate the original boss selection rows
                    const bossSelect = new StringSelectMenuBuilder()
                        .setCustomId('boss_select')
                        .setPlaceholder('Select a boss')
                        .addOptions(
                            raidData.bosses.map(boss => ({
                                label: boss.name,
                                value: boss.id.toString(),
                                description: `Select loot from ${boss.name}`
                            }))
                        );
                    const selectRow = new ActionRowBuilder().addComponents(bossSelect);

                    await i.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x0099FF)
                                .setTitle(`${raidData.raid} - Boss Selection`)
                                .setDescription('Select a boss for your item reservation.')
                                .setFooter({ text: `Step ${userState.currentStep} of 3: Boss Selection` })
                        ],
                        components: [selectRow],
                        files: []
                    });
                }
                else if (i.customId === 'confirm_reservation') {
                    console.log('Confirm reservation clicked');
                    console.log('Selected items:', userState.selectedItems);
                    console.log('Character name:', userState.characterName);

                    try {
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

                        console.log('Saving reservations:', reservations.weekly_reservations[currentWeek][userId]);
                        
                        // Save the reservations to file
                        saveReservations(reservations);
                        console.log('Reservations saved successfully');

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
                    } catch (saveError) {
                        console.error('Error saving reservations:', saveError);
                        await i.reply({
                            content: `Failed to save reservations: ${saveError.message}`,
                            ephemeral: true
                        });
                    }
                }
                else if (i.customId === 'cancel_reservation') {
                    console.log('Reservation cancelled');

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
                console.error('Error in collector:', error);
                try {
                    await i.reply({
                        content: `Something went wrong: ${error.message}`,
                        ephemeral: true
                    });
                } catch (replyError) {
                    console.error('Error replying to interaction:', replyError);
                }
            }
        });
    }
};