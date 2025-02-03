const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tournament-help')
        .setDescription('Show available tournament commands'),

    async execute(interaction) {
        try {
            const configPath = path.join(__dirname, '../../database/config.json');
            let config = {};
            let tournamentPhase = 'none'; // none, registration, active

            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config.tournament?.isActive) {
                    tournamentPhase = config.tournament.isRegistrationOpen ? 'registration' : 'active';
                }
            }

            const isManager = interaction.member.roles.cache.has(config.tournamentManagerRoleId);
            const isParticipant = interaction.member.roles.cache.has(config.tournamentRoleId);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Tournament Commands Help')
                .setDescription('Here are the commands you can use:');

            // Always available commands
            embed.addFields({
                name: '📖 General Commands',
                value: '`/tournament-help` - Show this help message\n' +
                      '`/tournament-status` - Show current tournament status\n' +
                      '`/tournament-list` - List all tournament participants'
            });

            // Manager-only commands
            if (isManager) {
                embed.addFields({
                    name: '⚡ Tournament Manager Commands',
                    value: '`/tournament-config set-manager-role` - Set the tournament manager role\n' +
                          '`/tournament-config set-tournament-role` - Set the tournament participant role\n' +
                          '`/tournament-create` - Create a new tournament\n' +
                          '`/tournament-end` - End the current tournament'
                });
            }

            // Phase-specific commands
            if (tournamentPhase === 'registration') {
                let participantCommands = '`/tournament-add` - Join the tournament\n' +
                                       '`/tournament-leave` - Leave the tournament';
                
                if (isManager) {
                    participantCommands += '\n`/tournament-start` - Start the tournament and close registration';
                }

                embed.addFields({
                    name: '📝 Registration Phase Commands',
                    value: participantCommands
                });
            }
            else if (tournamentPhase === 'active') {
                let activeCommands = '';
                
                if (isManager) {
                    activeCommands += '`/tournament-bracket` - Generate tournament brackets\n';
                }

                if (isManager || isParticipant) {
                    activeCommands += '`/tournament-report` - Report match results';
                }

                if (activeCommands) {
                    embed.addFields({
                        name: '🎮 Active Tournament Commands',
                        value: activeCommands
                    });
                }
            }
            else {
                embed.addFields({
                    name: '❗ No Active Tournament',
                    value: 'There is no tournament running. Tournament managers can use `/tournament-create` to start one.'
                });
            }

            // Add footer with current phase
            let phaseText = 'No Active Tournament';
            if (tournamentPhase === 'registration') phaseText = 'Registration Open';
            if (tournamentPhase === 'active') phaseText = 'Tournament In Progress';

            embed.setFooter({ text: `Current Phase: ${phaseText}` });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Error in tournament-help command:', error);
            return interaction.reply({
                content: 'There was an error while showing the help message.',
                ephemeral: true
            });
        }
    },
};
