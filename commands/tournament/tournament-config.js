const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdminOrAuthorizedUser } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('t-config')
        .setDescription('Configure tournament settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-manager-role')
                .setDescription('Set the tournament manager role')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role that can manage tournaments')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-tournament-role')
                .setDescription('Set the tournament participant role')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role that can participate in tournaments')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-channel')
                .setDescription('Set the channel for tournament commands')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel where tournament commands can be used')
                        .setRequired(true))),

    async execute(interaction) {
        // Check admin or authorized user permissions
        if (!isAdminOrAuthorizedUser(interaction)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        try {
            const subcommand = interaction.options.getSubcommand();
            const configPath = path.join(__dirname, '../../database/config.json');
            let config = {};
            
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(data) || {};
            }

            // Ensure config object has all necessary properties
            config = {
                ...config,
                tournamentManagerRoleId: config.tournamentManagerRoleId || null,
                tournamentRoleId: config.tournamentRoleId || null,
                tournamentChannelId: config.tournamentChannelId || null
            };

            if (subcommand === 'set-manager-role') {
                const role = interaction.options.getRole('role');
                config.tournamentManagerRoleId = role.id;
                
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                
                await interaction.reply({
                    content: `Tournament manager role set to: ${role.name}`,
                    ephemeral: false
                });
            } else if (subcommand === 'set-tournament-role') {
                const role = interaction.options.getRole('role');
                config.tournamentRoleId = role.id;
                
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                
                await interaction.reply({
                    content: `Tournament participant role set to: ${role.name}`,
                    ephemeral: false
                });
            } else if (subcommand === 'set-channel') {
                const channel = interaction.options.getChannel('channel');
                config.tournamentChannelId = channel.id;
                
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                
                await interaction.reply({
                    content: `Tournament commands channel set to: ${channel.name}`,
                    ephemeral: false
                });
            }
        } catch (error) {
            console.error('Tournament config error:', error);
            await interaction.reply({
                content: `Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
