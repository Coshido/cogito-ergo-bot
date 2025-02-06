const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { isAdminOrAuthorizedUser } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday-set-channel')
        .setDescription('Set the channel for birthday announcements')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send birthday messages in')
                .setRequired(true)),

    async execute(interaction) {
        // Check admin or authorized user permissions
        if (!isAdminOrAuthorizedUser(interaction)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        const channel = interaction.options.getChannel('channel');

        if (!channel.isTextBased()) {
            return interaction.reply({ content: 'Please select a text channel!', ephemeral: true });
        }

        try {
            const dbPath = path.join(__dirname, '../../database/birthday-data.json');
            
            // Read existing data or create new
            let data = { birthdays: {}, settings: {} };
            if (await fs.access(dbPath).then(() => true).catch(() => false)) {
                data = JSON.parse(await fs.readFile(dbPath, 'utf8'));
            }

            // Ensure settings object exists
            if (!data.settings) {
                data.settings = {};
            }

            // Update birthday channel
            data.settings.announcementChannelId = channel.id;

            // Write updated data
            await fs.writeFile(dbPath, JSON.stringify(data, null, 2));

            await interaction.reply({ 
                content: `Birthday announcements will now be sent in ${channel}! 🎉`, 
                ephemeral: false 
            });
        } catch (error) {
            console.error('Birthday channel setup error:', error);
            await interaction.reply({ 
                content: `Error setting birthday channel: ${error.message}`, 
                ephemeral: true 
            });
        }
    }
};