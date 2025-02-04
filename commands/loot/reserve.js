const { SlashCommandBuilder } = require('discord.js');
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ImageComposer = require('../../utils/image-composer');
const { AttachmentBuilder } = require('discord.js');

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

// Helper function to save reservations
function saveReservations(reservations) {
    const reservationsPath = path.join(__dirname, '../../database/reservations.json');
    fs.writeFileSync(reservationsPath, JSON.stringify(reservations, null, 2));
}

// Helper function to create item select menu
function createItemSelectMenu(items, customId) {
    return new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder('Select an item to reserve')
        .addOptions(
            items.map((item, index) => ({
                label: `${index + 1}- ${item.name}`,
                description: item.type.toLowerCase() === 'non equipaggiabile cianfrusaglie' ? 'Emblema' : item.type,
                value: item.id
            }))
        );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve')
        .setDescription('Reserve items from the current raid'),

    async execute(interaction) {
        const currentWeek = getCurrentWeekMonday();
        const reservations = loadReservations();
        const userId = interaction.user.id;

        // Initialize user's weekly reservations if not exists
        if (!reservations.weekly_reservations[currentWeek]) {
            reservations.weekly_reservations[currentWeek] = {};
        }
        
        const userReservations = reservations.weekly_reservations[currentWeek][userId] || [];
        if (userReservations.length >= 2) {
            // Create reservation image
            const reservationImage = await ImageComposer.createReservationImage(userReservations);
            const attachment = new AttachmentBuilder(reservationImage, { name: 'current-reservations.png' });

            // Create WowHead links
            const wowheadLinks = userReservations
                .map((item, index) => `${index + 1}- [${item.name}](${item.wowhead_url})`)
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)  // Red color to indicate can't add more
                .setTitle('Maximum Reservations Reached')
                .setImage('attachment://current-reservations.png')
                .setDescription(`You have already reserved 2 items this week!\n\n**Link su WowHead**\n${wowheadLinks}`);

            return await interaction.reply({
                embeds: [embed],
                files: [attachment],
                ephemeral: true
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
            currentStep: 1
        };

        // Create boss selection dropdown
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

        const row = new ActionRowBuilder()
            .addComponents(bossSelect);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`${raidData.raid} - Loot Reservation`)
            .setDescription(`Select a boss to view their loot table.\nYou can reserve up to 2 items per week.\nYou have ${2 - userReservations.length} reservations remaining.`)
            .setFooter({ text: `Step ${userState.currentStep} of 3: Boss Selection` });

        const initialMessage = await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
            fetchReply: true
        });

        // Create collectors for the entire flow
        const filter = i => i.user.id === interaction.user.id;
        const collector = initialMessage.createMessageComponentCollector({ filter, time: 300000 }); // 5 minutes

        collector.on('collect', async i => {
            try {
                if (i.customId === 'boss_select') {
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
                        .setDescription(`Select a boss to view their loot table.\nYou can reserve up to 2 items per week.\nYou have ${2 - userReservations.length} reservations remaining.`)
                        .setFooter({ text: `Step ${userState.currentStep} of 3: Boss Selection` });

                    await i.update({
                        embeds: [embed],
                        components: [row],  // This is the original boss selection row
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
                        wowhead_url: selectedItem.wowhead_url
                    });

                    if (userState.selectedItems.length < 2 && userReservations.length === 0) {
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
                            components: [row],
                            files: []
                        });
                    } else {
                        // Show confirmation screen
                        userState.currentStep = 3;
                        const confirmEmbed = new EmbedBuilder()
                            .setColor(0x0099FF)
                            .setTitle('Confirm Your Reservations')
                            .setDescription('Please review and confirm your selections:')
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
                    // Save the reservations with all the needed data
                    reservations.weekly_reservations[currentWeek][userId] = [
                        ...(reservations.weekly_reservations[currentWeek][userId] || []),
                        ...userState.selectedItems
                    ];
                    saveReservations(reservations);

                    // Create final image
                    const reservationImage = await ImageComposer.createReservationImage(userState.selectedItems);
                    const attachment = new AttachmentBuilder(reservationImage, { name: 'reservations.png' });

                    const finalEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('Reservations Confirmed!')
                        .setImage('attachment://reservations.png')
                        .setDescription(`Your items have been reserved for this week!\n\n**Link su WowHead**\n${userState.selectedItems.map((item, index) => `${index + 1}- [${item.name}](${item.wowhead_url})`).join('\n')}`);

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
                console.error('Error in collector:', error);
                await i.reply({ 
                    content: 'An error occurred while processing your selection', 
                    ephemeral: true 
                }).catch(console.error);
            }
        });
    }
};