const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday-set-channel')
        .setDescription('Set the channel for birthday announcements')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send birthday messages in')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (!channel.isTextBased()) {
            return interaction.reply({ content: 'Please select a text channel!', ephemeral: true });
        }

        try {
            const dbPath = path.join(__dirname, '../../database/birthday-data.json');
            const data = JSON.parse(await fs.readFile(dbPath, 'utf8'));

            // Store channel ID
            data.channels[interaction.guildId] = channel.id;
            await fs.writeFile(dbPath, JSON.stringify(data, null, 4));
            
            await interaction.reply({ content: `Birthday announcements will now be sent in ${channel}! 🎉`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error setting the birthday channel!', ephemeral: true });
        }
    },
}; 