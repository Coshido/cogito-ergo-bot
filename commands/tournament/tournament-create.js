const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('t-create')
        .setDescription('Create a new tournament')
        .addStringOption(option =>
            option
                .setName('name')
                .setDescription('Name of the tournament')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('format')
                .setDescription('Tournament format')
                .setRequired(true)
                .addChoices(
                    { name: 'Single Elimination', value: 'single' },
                    { name: 'Double Elimination', value: 'double' }
                ))
        .addIntegerOption(option =>
            option
                .setName('max-participants')
                .setDescription('Maximum number of participants')
                .setMinValue(2)
                .setMaxValue(128)),

    async execute(interaction) {
        try {
            // Check if user has the tournament manager role
            const configPath = path.join(__dirname, '../../database/config.json');
            let config = {};
            
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(data);
            }
            
            if (!config.tournamentManagerRoleId) {
                return interaction.reply({ 
                    content: 'Tournament manager role has not been set. Please ask an administrator to set it using `/t-config set-manager-role`', 
                    ephemeral: true 
                });
            }

            // Check if user has the tournament manager role
            const hasRole = interaction.member.roles.cache.has(config.tournamentManagerRoleId);
            
            if (!hasRole) {
                const role = interaction.guild.roles.cache.get(config.tournamentManagerRoleId);
                return interaction.reply({ 
                    content: `You need the ${role.name} role to create tournaments!`, 
                    ephemeral: true 
                });
            }

            if (config.tournament?.isActive) {
                return interaction.reply({
                    content: 'A tournament is already active. End it first before creating a new one.',
                    ephemeral: true
                });
            }

            const name = interaction.options.getString('name');
            const format = interaction.options.getString('format');
            const maxParticipants = interaction.options.getInteger('max-participants') || 32;

            config.tournament = {
                isActive: true,
                isRegistrationOpen: true, // New flag for registration phase
                name: name,
                format: format,
                currentRound: 0,
                maxParticipants: maxParticipants,
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.id,
                startedAt: null, // Will be set when tournament actually starts
                startedBy: null
            };

            // Create a fresh tournament list
            const tournamentListPath = path.join(__dirname, '../../database/tournament-list.json');
            fs.writeFileSync(tournamentListPath, JSON.stringify({ 
                participants: [],
                created_at: new Date().toISOString()
            }, null, 2));

            // Save config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('New Tournament Created! 🏆')
                .setDescription('Registration is now open! Use `/t-join` to join.')
                .addFields(
                    { name: 'Name', value: name },
                    { name: 'Format', value: format.charAt(0).toUpperCase() + format.slice(1) },
                    { name: 'Max Participants', value: maxParticipants.toString() }
                )
                .setFooter({ text: 'Use /t-start when ready to begin the tournament' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in tournament-create command:', error);
            return interaction.reply({
                content: 'There was an error while creating the tournament.',
                ephemeral: true
            });
        }
    },
};
