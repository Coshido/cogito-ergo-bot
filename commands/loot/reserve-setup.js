const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'database', 'config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-setup')
        .setDescription('Set up raid leader and raider roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option => 
            option.setName('raid_leader_role')
                .setDescription('Select the Raid Leader role')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('raider_role')
                .setDescription('Select the Raider role')
                .setRequired(true)),

    async execute(interaction) {
        // Ensure only administrators can use this command
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'Only server administrators can use this command.',
                ephemeral: true
            });
        }

        // Get the selected roles
        const raidLeaderRole = interaction.options.getRole('raid_leader_role');
        const raiderRole = interaction.options.getRole('raider_role');

        // Read existing config
        let config = {};
        try {
            config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        } catch (error) {
            console.error('Error reading config file:', error);
            config = {}; // Initialize empty config if file doesn't exist
        }

        // Update roles in config
        config.raidLeaderRoleId = raidLeaderRole.id;
        config.raiderRoleId = raiderRole.id;

        // Ensure the directory exists
        const configDir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // Write updated config
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Error writing config file:', error);
            return interaction.reply({
                content: 'Failed to save role configuration.',
                ephemeral: true
            });
        }

        // Confirm successful setup
        await interaction.reply({
            content: `✅ Roles successfully configured:\n` +
                    `🏆 Raid Leader Role: ${raidLeaderRole.name}\n` +
                    `🛡️ Raider Role: ${raiderRole.name}`,
            ephemeral: true
        });
    }
};
