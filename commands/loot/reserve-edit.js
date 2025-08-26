const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ImageComposer = require('../../utils/image-composer');
const { AttachmentBuilder } = require('discord.js');
const { getCurrentWeekMonday, loadReservations, saveReservations } = require('../../utils/reservation-utils');
const { createItemSelectMenu } = require('../../utils/discord-utils');
const { isRaider } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-edit')
        .setDescription('Modifica le reserve della settimana corrente'),

    async execute(interaction) {
        // Check if user is a raider
        if (!isRaider(interaction.member)) {
            return interaction.reply({
                content: 'Solo i Raiders possono modificare le reserve degli oggetti.',
                ephemeral: true
            });
        }

        const currentWeek = getCurrentWeekMonday();
        const reservations = loadReservations();
        const userId = interaction.user.id;

        // Read raid loot data
        const raidData = JSON.parse(fs.readFileSync(
            path.join(__dirname, '../../database/raid-loot.json'),
            'utf8'
        ));

        // Check if user has any reservations this week
        const userData = reservations.weekly_reservations[currentWeek]?.[userId];
        if (!userData || userData.items.length === 0) {
            return await interaction.reply({
                content: 'Non hai reserve per questa settimana!',
                ephemeral: true
            });
        }

        // Show current reservations with options to edit
        const reservationImage = await ImageComposer.createReservationImage(userData.items);
        const attachment = new AttachmentBuilder(reservationImage, { name: 'current-reservations.png' });

        // Create buttons for each item and character name
        const itemButtons = userData.items.map((item, index) => 
            new ButtonBuilder()
                .setCustomId(`edit_item_${index}`)
                .setLabel(`Sostituisci oggetto ${index + 1}`)
                .setStyle(ButtonStyle.Primary)
        );

        const characterButton = new ButtonBuilder()
            .setCustomId('edit_character_name')
            .setLabel('Modifica nome personaggio')
            .setStyle(ButtonStyle.Secondary);

        const buttonRow1 = new ActionRowBuilder().addComponents(itemButtons);
        const buttonRow2 = new ActionRowBuilder().addComponents(characterButton);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Le tue reserve attuali')
            .setImage('attachment://current-reservations.png')
            .setDescription(
                `Reserve correnti per il personaggio **${userData.character_name}**\n` +
                `**Link su WowHead**\n${userData.items.map((item, index) => 
                    `${index + 1}- [${item.name}](${item.wowhead_url})`
                ).join('\n')}\n` +
                'Seleziona cosa vuoi modificare:'
            );

        const message = await interaction.reply({
            embeds: [embed],
            components: [buttonRow1, buttonRow2],
            files: [attachment],
            ephemeral: true,
            fetchReply: true
        });

        // Create collector for button interactions
        const collector = interaction.channel.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 300000 // 5 minutes
        });

        // Store state for the edit process
        const editState = {
            itemIndex: null,
            currentBoss: null
        };

        collector.on('collect', async (i) => {
            try {
                if (i.customId === 'edit_character_name') {
                    // Create a modal for character name input
                    const modal = new ModalBuilder()
                        .setCustomId('change_character_name')
                        .setTitle('Modifica nome personaggio');

                    const characterNameInput = new TextInputBuilder()
                        .setCustomId('new_character_name')
                        .setLabel('Nuovo nome personaggio')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(userData.character_name)
                        .setRequired(true);

                    const actionRow = new ActionRowBuilder().addComponents(characterNameInput);
                    modal.addComponents(actionRow);

                    await i.showModal(modal);

                    // Wait for modal submission
                    const modalSubmitInteraction = await i.awaitModalSubmit({
                        filter: (mi) => mi.customId === 'change_character_name' && mi.user.id === interaction.user.id,
                        time: 60000
                    });

                    const newCharacterName = modalSubmitInteraction.fields.getTextInputValue('new_character_name');

                    // Update the character name in reservations
                    userData.character_name = newCharacterName;
                    reservations.weekly_reservations[currentWeek][userId] = userData;
                    saveReservations(reservations);

                    await modalSubmitInteraction.reply({
                        content: `Nome personaggio aggiornato a **${newCharacterName}**`,
                        ephemeral: true
                    });

                    // Update the original message
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x0099FF)
                                .setTitle('Le Tue Reserve Attuali')
                                .setImage('attachment://current-reservations.png')
                                .setDescription(
                                    `Reserve correnti per il personaggio **${newCharacterName}**\n` +
                                    `**Link su WowHead**\n${userData.items.map((item, index) => 
                                        `${index + 1}- [${item.name}](${item.wowhead_url})`
                                    ).join('\n')}\n` +
                                    'Seleziona cosa vuoi modificare:'
                                )
                        ],
                        components: [buttonRow1, buttonRow2],
                        files: [attachment]
                    });
                    return; // Do not continue processing this interaction
                }

                // For all other interactions, defer the update as we will edit the original message
                await i.deferUpdate();

                if (i.customId.startsWith('edit_item_')) {
                    const itemIndex = parseInt(i.customId.split('_')[2]);
                    editState.itemIndex = itemIndex;  // Store in editState instead of i.editItemIndex
                    
                    // Create boss selection dropdown
                    const bossSelect = new StringSelectMenuBuilder()
                        .setCustomId('boss_select')
                        .setPlaceholder('Seleziona un boss')
                        .addOptions(
                            raidData.bosses.map(boss => ({
                                label: boss.name,
                                value: boss.id.toString(),
                                description: `Seleziona loot da ${boss.name}`
                            }))
                        );

                    const row = new ActionRowBuilder()
                        .addComponents(bossSelect);

                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`${raidData.raid} - Sostituisci Oggetto ${itemIndex + 1}`)
                        .setDescription('Seleziona un boss per visualizzare il suo loot.')
                        .setFooter({ text: 'Passo 1 di 2: Selezione Boss' });

                    await i.editReply({
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
                        .setFooter({ text: 'Passo 2 di 2: Selezione Oggetto' });

                    // Create item selection menu
                    const itemSelect = createItemSelectMenu(selectedBoss.loot, 'item_select');
                    const selectRow = new ActionRowBuilder().addComponents(itemSelect);

                    // Create Back to Bosses button
                    const backToBossesButton = new ButtonBuilder()
                        .setCustomId('back_to_bosses')
                        .setLabel('Torna ai Boss')
                        .setStyle(ButtonStyle.Secondary);
                    const buttonRow = new ActionRowBuilder().addComponents(backToBossesButton);

                    await i.editReply({
                        embeds: [lootEmbed],
                        files: [attachment],
                        components: [selectRow, buttonRow]
                    });
                }
                else if (i.customId === 'back_to_bosses') {
                    // Recreate boss selection dropdown
                    const bossSelect = new StringSelectMenuBuilder()
                        .setCustomId('boss_select')
                        .setPlaceholder('Seleziona un boss')
                        .addOptions(
                            raidData.bosses.map(boss => ({
                                label: boss.name,
                                value: boss.id.toString(),
                                description: `Seleziona loot da ${boss.name}`
                            }))
                        );

                    const row = new ActionRowBuilder()
                        .addComponents(bossSelect);

                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`${raidData.raid} - Sostituisci Oggetto ${editState.itemIndex + 1}`)
                        .setDescription('Seleziona un boss per visualizzare il suo loot.')
                        .setFooter({ text: 'Passo 1 di 2: Selezione Boss' });

                    await i.editReply({
                        embeds: [embed],
                        components: [row],
                        files: []
                    });
                }
                else if (i.customId === 'item_select') {
                    const selectedItem = editState.currentBoss.loot.find(item => item.id === i.values[0]);
                    
                    // Directly replace the item in userData
                    const originalItem = userData.items[editState.itemIndex];
                    userData.items[editState.itemIndex] = selectedItem;

                    // Save the updated reservations
                    reservations.weekly_reservations[currentWeek][userId] = userData;
                    saveReservations(reservations);

                    // Regenerate reservation image
                    const reservationImage = await ImageComposer.createReservationImage(userData.items);
                    const attachment = new AttachmentBuilder(reservationImage, { name: 'current-reservations.png' });

                    // Recreate item buttons
                    const itemButtons = userData.items.map((item, index) => 
                        new ButtonBuilder()
                            .setCustomId(`edit_item_${index}`)
                            .setLabel(`Sostituisci Oggetto ${index + 1}`)
                            .setStyle(ButtonStyle.Primary)
                    );

                    const characterButton = new ButtonBuilder()
                        .setCustomId('edit_character_name')
                        .setLabel('Modifica Nome Personaggio')
                        .setStyle(ButtonStyle.Secondary);

                    const buttonRow1 = new ActionRowBuilder().addComponents(itemButtons);
                    const buttonRow2 = new ActionRowBuilder().addComponents(characterButton);

                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Le Tue Reserve Attuali')
                        .setImage('attachment://current-reservations.png')
                        .setDescription(
                            `Reserve correnti per il personaggio **${userData.character_name}**\n` +
                            `**Link su WowHead**\n${userData.items.map((item, index) => 
                                `${index + 1}- [${item.name}](${item.wowhead_url})`
                            ).join('\n')}\n` +
                            'Seleziona cosa vuoi modificare:'
                        );

                    await i.editReply({
                        embeds: [embed],
                        components: [buttonRow1, buttonRow2],
                        files: [attachment]
                    });
                }
                else if (i.customId === 'confirm_edit') {
                    // Save the updated reservations
                    reservations.weekly_reservations[currentWeek][userId] = userData;
                    saveReservations(reservations);

                    // Regenerate final reservation image
                    const finalReservationImage = await ImageComposer.createReservationImage(userData.items);
                    const finalAttachment = new AttachmentBuilder(finalReservationImage, { name: 'final-reservations.png' });

                    const finalConfirmEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('Prenotazione Aggiornata!')
                        .setImage('attachment://final-reservations.png')
                        .setDescription(
                            `I tuoi oggetti sono stati aggiornati per il personaggio **${userData.character_name}**!\n\n` +
                            `**Link su WowHead**\n${userData.items.map((item, index) => 
                                `${index + 1}- [${item.name}](${item.wowhead_url})`
                            ).join('\n')}`
                        );

                    await i.editReply({
                        embeds: [finalConfirmEmbed],
                        files: [finalAttachment],
                        components: []
                    });

                    collector.stop();
                }
                else if (i.customId === 'cancel_edit') {
                    // Revert the item change
                    userData.items[editState.itemIndex] = userData.items[editState.itemIndex];

                    // Go back to the original reservation screen
                    const reservationImage = await ImageComposer.createReservationImage(userData.items);
                    const attachment = new AttachmentBuilder(reservationImage, { name: 'current-reservations.png' });

                    const itemButtons = userData.items.map((item, index) => 
                        new ButtonBuilder()
                            .setCustomId(`edit_item_${index}`)
                            .setLabel(`Sostituisci Oggetto ${index + 1}`)
                            .setStyle(ButtonStyle.Primary)
                    );

                    const characterButton = new ButtonBuilder()
                        .setCustomId('edit_character_name')
                        .setLabel('Modifica Nome Personaggio')
                        .setStyle(ButtonStyle.Secondary);

                    const buttonRow1 = new ActionRowBuilder().addComponents(itemButtons);
                    const buttonRow2 = new ActionRowBuilder().addComponents(characterButton);

                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Le Tue Reserve Attuali')
                        .setImage('attachment://current-reservations.png')
                        .setDescription(
                            `Reserve correnti per il personaggio **${userData.character_name}**\n` +
                            `**Link su WowHead**\n${userData.items.map((item, index) => 
                                `${index + 1}- [${item.name}](${item.wowhead_url})`
                            ).join('\n')}\n` +
                            'Seleziona cosa vuoi modificare:'
                        );

                    await i.editReply({
                        embeds: [embed],
                        components: [buttonRow1, buttonRow2],
                        files: [attachment]
                    });
                }
            } catch (error) {
                console.error('Interaction handling error:', error);
                
                // Try to send an error message if possible
                try {
                    await interaction.followUp({
                        content: 'Si è verificato un errore durante l\'elaborazione della tua interazione. Riprova.',
                        ephemeral: true
                    });
                } catch (followUpError) {
                    console.error('Could not send error follow-up:', followUpError);
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                try {
                    interaction.editReply({
                        content: 'Tempo scaduto per la selezione. Per favore ricomincia.',
                        embeds: [],
                        components: [],
                        files: []
                    });
                } catch (error) {
                    console.error('Error clearing timed-out interaction:', error);
                }
            }
        });
    },
}; 