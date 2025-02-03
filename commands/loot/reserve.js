const { SlashCommandBuilder } = require('discord.js');
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
            items.map(item => ({
                label: item.name,
                description: `${item.type} (iLvl ${item.ilvl || 'N/A'})`,
                value: item.id.toString(),
                emoji: { id: null, name: '🎁' } // Add gift emoji to all items
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
            return await interaction.reply({
                content: 'You have already reserved 2 items this week. Your current reservations:\n' +
                    userReservations.map(item => `- ${item.name} from ${item.boss}`).join('\n'),
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
            .addFields(
                { name: 'Item Levels', value: raidData.difficulties.map(d => `${d.name}: ${d.ilvl_base}`).join('\n') }
            )
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
            if (i.customId === 'boss_select') {
                const selectedBoss = raidData.bosses.find(b => b.id.toString() === i.values[0]);
                userState.currentBoss = selectedBoss;
                
                const lootEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`${selectedBoss.name}'s Loot Table`)
                    .setDescription('Select an item to reserve:')
                    .setFooter({ text: `Step ${userState.currentStep} of 3: Item Selection` });

                for (const item of selectedBoss.loot) {
                    const iconDisplay = item.icon ? `[🎁](${item.icon})` : '🎁';
                    lootEmbed.addFields({
                        name: `🎁 ${item.name}`,
                        value: `${item.type} (iLvl ${item.ilvl || 'N/A'})${item.icon ? `\n[View Icon](${item.icon})` : ''}`,
                        inline: true
                    });
                }

                const itemSelect = createItemSelectMenu(selectedBoss.loot, 'item_select');

                const itemRow = new ActionRowBuilder()
                    .addComponents(itemSelect);

                await i.update({
                    embeds: [lootEmbed],
                    components: [itemRow],
                });
            }
            else if (i.customId === 'item_select') {
                const selectedItem = userState.currentBoss.loot.find(item => item.id === parseInt(i.values[0]));
                userState.selectedItems.push({
                    id: selectedItem.id,
                    name: selectedItem.name,
                    boss: userState.currentBoss.name,
                    type: selectedItem.type,
                    ilvl: selectedItem.ilvl
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
                    });
                } else {
                    // Show confirmation screen
                    userState.currentStep = 3;
                    const confirmEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Confirm Your Reservations')
                        .setDescription('Please review and confirm your selections:')
                        .addFields(
                            userState.selectedItems.map((item, index) => ({
                                name: `Item ${index + 1}`,
                                value: `🎁 ${item.name}\nFrom: ${item.boss}\nType: ${item.type}\nItem Level: ${item.ilvl}`,
                                inline: true
                            }))
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

                    await i.update({
                        embeds: [confirmEmbed],
                        components: [confirmRow],
                    });
                }
            }
            else if (i.customId === 'confirm_reservation') {
                // Save the reservations
                reservations.weekly_reservations[currentWeek][userId] = [
                    ...(reservations.weekly_reservations[currentWeek][userId] || []),
                    ...userState.selectedItems
                ];
                saveReservations(reservations);

                const finalEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('Reservations Confirmed!')
                    .setDescription('Your items have been reserved for this week:')
                    .addFields(
                        userState.selectedItems.map((item, index) => ({
                            name: `Item ${index + 1}`,
                            value: `🎁 ${item.name} from ${item.boss}`,
                            inline: true
                        }))
                    );

                await i.update({
                    embeds: [finalEmbed],
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
                });
                collector.stop();
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Reservation Timed Out')
                    .setDescription('The reservation process has timed out. Please try again.');

                await interaction.editReply({
                    embeds: [timeoutEmbed],
                    components: [],
                });
            }
        });
    },
};
