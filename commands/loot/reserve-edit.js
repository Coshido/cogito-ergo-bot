const { SlashCommandBuilder } = require('discord.js');
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ImageComposer = require('../../utils/image-composer');
const { AttachmentBuilder } = require('discord.js');

// Helper functions
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

function saveReservations(reservations) {
    const reservationsPath = path.join(__dirname, '../../database/reservations.json');
    fs.writeFileSync(reservationsPath, JSON.stringify(reservations, null, 2));
}

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
        .setName('reserve-edit')
        .setDescription('Edit your current week reservations'),

    async execute(interaction) {
        const currentWeek = getCurrentWeekMonday();
        const reservations = loadReservations();
        const userId = interaction.user.id;

        // Read raid loot data
        const raidData = JSON.parse(fs.readFileSync(
            path.join(__dirname, '../../database/raid-loot.json'),
            'utf8'
        ));

        // Check if user has any reservations this week
        const userReservations = reservations.weekly_reservations[currentWeek]?.[userId] || [];
        if (userReservations.length === 0) {
            return await interaction.reply({
                content: 'You have no reservations for this week!',
                ephemeral: true
            });
        }

        // Show current reservations with options to edit
        const reservationImage = await ImageComposer.createReservationImage(userReservations);
        const attachment = new AttachmentBuilder(reservationImage, { name: 'current-reservations.png' });

        // Create buttons for each item
        const buttons = userReservations.map((item, index) => 
            new ButtonBuilder()
                .setCustomId(`edit_item_${index}`)
                .setLabel(`Replace Item ${index + 1}`)
                .setStyle(ButtonStyle.Primary)
        );

        const buttonRow = new ActionRowBuilder().addComponents(buttons);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Your Current Reservations')
            .setImage('attachment://current-reservations.png')
            .setDescription('Select which item you want to replace:');

        const message = await interaction.reply({
            embeds: [embed],
            components: [buttonRow],
            files: [attachment],
            ephemeral: true,
            fetchReply: true
        });

        // Create collector for button interactions
        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 300000 // 5 minutes
        });

        // Store state for the edit process
        const editState = {
            itemIndex: null,
            currentBoss: null
        };

        collector.on('collect', async i => {
            try {
                if (i.customId.startsWith('edit_item_')) {
                    const itemIndex = parseInt(i.customId.split('_')[2]);
                    editState.itemIndex = itemIndex;  // Store in editState instead of i.editItemIndex
                    
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
                        .setTitle(`${raidData.raid} - Replace Item ${itemIndex + 1}`)
                        .setDescription('Select a boss to view their loot table.')
                        .setFooter({ text: 'Step 1 of 2: Boss Selection' });

                    await i.update({
                        embeds: [embed],
                        components: [row],
                        files: []
                    });
                }
                else if (i.customId === 'boss_select') {
                    const selectedBoss = raidData.bosses.find(b => b.id.toString() === i.values[0]);
                    editState.currentBoss = selectedBoss;  // Store the selected boss
                    
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
                        .setFooter({ text: 'Step 2 of 2: Item Selection' });

                    // Create item selection menu
                    const itemSelect = createItemSelectMenu(selectedBoss.loot, 'item_select');
                    const selectRow = new ActionRowBuilder().addComponents(itemSelect);

                    await i.update({
                        embeds: [lootEmbed],
                        files: [attachment],
                        components: [selectRow]
                    });
                }
                else if (i.customId === 'item_select') {
                    const selectedItem = editState.currentBoss.loot.find(item => item.id === i.values[0]);
                    
                    // Update the reservation with all required fields
                    const itemToReplace = editState.itemIndex;
                    userReservations[itemToReplace] = {
                        id: selectedItem.id,
                        name: selectedItem.name,
                        boss: editState.currentBoss.name,
                        type: selectedItem.type,        // Make sure type is included
                        ilvl: selectedItem.ilvl,
                        icon: selectedItem.icon,        // Make sure icon is included
                        wowhead_url: selectedItem.wowhead_url
                    };

                    // Save the updated reservations
                    reservations.weekly_reservations[currentWeek][userId] = userReservations;
                    saveReservations(reservations);

                    // Create final image with the complete userReservations array
                    const reservationImage = await ImageComposer.createReservationImage(userReservations);
                    const attachment = new AttachmentBuilder(reservationImage, { name: 'reservations.png' });

                    // Add debug logging
                    console.log('Updated reservations:', JSON.stringify(userReservations, null, 2));

                    const wowheadLinks = userReservations
                        .map((item, index) => `${index + 1}- [${item.name}](${item.wowhead_url})`)
                        .join('\n');

                    const finalEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('Reservation Updated!')
                        .setImage('attachment://reservations.png')
                        .setDescription(`Your items have been updated!\n\n**Link su WowHead**\n${wowheadLinks}`);

                    await i.update({
                        embeds: [finalEmbed],
                        files: [attachment],
                        components: []
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

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Edit Timed Out')
                    .setDescription('The edit process has timed out. Please try again.');

                await interaction.editReply({
                    embeds: [timeoutEmbed],
                    components: [],
                    files: []
                });
            }
        });
    },
}; 