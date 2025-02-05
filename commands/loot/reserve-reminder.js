const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { isRaider } = require('../../utils/permission-utils');
const UserPreferences = require('../../utils/user-preferences');
const { getCurrentWeekMonday, loadReservations } = require('../../utils/reservation-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-reminder')
        .setDescription('Configure your reservation reminders'),

    async execute(interaction) {
        // Check if user is a raider
        if (!await isRaider(interaction.member)) {
            return interaction.reply({
                content: 'Only Raiders can configure reservation reminders.',
                ephemeral: true
            });
        }

        // Load current user preferences
        const currentPreferences = await UserPreferences.getReminderPreferences(interaction.user.id);

        // Create enable/disable button
        const enableButton = new ButtonBuilder()
            .setCustomId('toggle_reminders')
            .setLabel(currentPreferences.enabled ? 'Disable Reminders' : 'Enable Reminders')
            .setStyle(currentPreferences.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

        // Create reminder type select menu
        const reminderTypeSelect = new StringSelectMenuBuilder()
            .setCustomId('reminder_type')
            .setPlaceholder('Select Reminder Type')
            .setDisabled(!currentPreferences.enabled)
            .addOptions([
                {
                    label: 'No Reminders',
                    value: 'none',
                    default: currentPreferences.type === 'none'
                },
                {
                    label: 'Remind if No Reservations',
                    value: 'unreserved',
                    default: currentPreferences.type === 'unreserved'
                },
                {
                    label: 'Show Current Reservations',
                    value: 'current',
                    default: currentPreferences.type === 'current'
                },
                {
                    label: 'Both Types of Reminders',
                    value: 'both',
                    default: currentPreferences.type === 'both'
                }
            ]);

        // Create day select menu
        const daySelect = new StringSelectMenuBuilder()
            .setCustomId('reminder_day')
            .setPlaceholder('Select Reminder Day')
            .setDisabled(!currentPreferences.enabled)
            .addOptions([
                { label: 'Monday', value: '1' },
                { label: 'Tuesday', value: '2' },
                { label: 'Wednesday', value: '3' },
                { label: 'Thursday', value: '4' },
                { label: 'Friday', value: '5' },
                { label: 'Saturday', value: '6' },
                { label: 'Sunday', value: '0' }
            ]);

        // Create hour select menu (0-23)
        const hourSelect = new StringSelectMenuBuilder()
            .setCustomId('reminder_hour')
            .setPlaceholder('Select Reminder Hour')
            .setDisabled(!currentPreferences.enabled)
            .addOptions(
                Array.from({length: 24}, (_, i) => ({
                    label: `${i}:00`,
                    value: i.toString()
                }))
            );

        // Create action rows
        const buttonRow = new ActionRowBuilder().addComponents(enableButton);
        const typeRow = new ActionRowBuilder().addComponents(reminderTypeSelect);
        const dayRow = new ActionRowBuilder().addComponents(daySelect);
        const hourRow = new ActionRowBuilder().addComponents(hourSelect);

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('Reservation Reminder Settings')
            .setDescription(
                `Current Settings:\n` +
                `Enabled: ${currentPreferences.enabled ? 'Yes' : 'No'}\n` +
                `Reminder Type: ${currentPreferences.type}\n` +
                `Reminder Day: ${currentPreferences.day ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentPreferences.day] : 'Not Set'}\n` +
                `Reminder Hour: ${currentPreferences.hour !== null ? `${currentPreferences.hour}:00` : 'Not Set'}`
            )
            .setColor(0x0099FF);

        // Send the message
        const response = await interaction.reply({
            embeds: [embed],
            components: [buttonRow, typeRow, dayRow, hourRow],
            ephemeral: true
        });

        // Create a collector for interactions
        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (i) => {
            let updatedPreferences = await UserPreferences.getReminderPreferences(interaction.user.id);

            if (i.customId === 'toggle_reminders') {
                // Toggle reminders on/off
                updatedPreferences.enabled = !updatedPreferences.enabled;
                
                // Reset other settings if disabled
                if (!updatedPreferences.enabled) {
                    updatedPreferences.type = 'none';
                    updatedPreferences.day = null;
                    updatedPreferences.hour = null;
                }
            } else if (i.customId === 'reminder_type') {
                // Update reminder type
                updatedPreferences.type = i.values[0];
            } else if (i.customId === 'reminder_day') {
                // Update reminder day
                updatedPreferences.day = parseInt(i.values[0]);
            } else if (i.customId === 'reminder_hour') {
                // Update reminder hour
                updatedPreferences.hour = parseInt(i.values[0]);
            }

            // Save updated preferences
            await UserPreferences.setReminderPreferences(interaction.user.id, updatedPreferences);

            // Update the embed and components
            const updatedEmbed = EmbedBuilder.from(embed)
                .setDescription(
                    `Current Settings:\n` +
                    `Enabled: ${updatedPreferences.enabled ? 'Yes' : 'No'}\n` +
                    `Reminder Type: ${updatedPreferences.type}\n` +
                    `Reminder Day: ${updatedPreferences.day !== null ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][updatedPreferences.day] : 'Not Set'}\n` +
                    `Reminder Hour: ${updatedPreferences.hour !== null ? `${updatedPreferences.hour}:00` : 'Not Set'}`
                );

            // Recreate components with updated state
            const updatedEnableButton = new ButtonBuilder()
                .setCustomId('toggle_reminders')
                .setLabel(updatedPreferences.enabled ? 'Disable Reminders' : 'Enable Reminders')
                .setStyle(updatedPreferences.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

            const updatedTypeSelect = StringSelectMenuBuilder.from(reminderTypeSelect)
                .setDisabled(!updatedPreferences.enabled)
                .setOptions([
                    {
                        label: 'No Reminders',
                        value: 'none',
                        default: updatedPreferences.type === 'none'
                    },
                    {
                        label: 'Remind if No Reservations',
                        value: 'unreserved',
                        default: updatedPreferences.type === 'unreserved'
                    },
                    {
                        label: 'Show Current Reservations',
                        value: 'current',
                        default: updatedPreferences.type === 'current'
                    },
                    {
                        label: 'Both Types of Reminders',
                        value: 'both',
                        default: updatedPreferences.type === 'both'
                    }
                ]);

            const updatedDaySelect = StringSelectMenuBuilder.from(daySelect)
                .setDisabled(!updatedPreferences.enabled);

            const updatedHourSelect = StringSelectMenuBuilder.from(hourSelect)
                .setDisabled(!updatedPreferences.enabled);

            const updatedButtonRow = new ActionRowBuilder().addComponents(updatedEnableButton);
            const updatedTypeRow = new ActionRowBuilder().addComponents(updatedTypeSelect);
            const updatedDayRow = new ActionRowBuilder().addComponents(updatedDaySelect);
            const updatedHourRow = new ActionRowBuilder().addComponents(updatedHourSelect);

            // Update the message
            await i.update({
                embeds: [updatedEmbed],
                components: [updatedButtonRow, updatedTypeRow, updatedDayRow, updatedHourRow]
            });
        });
    }
};
