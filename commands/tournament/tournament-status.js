const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkChannel } = require('../../utils/tournamentUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('t-status')
        .setDescription('Show the current tournament status'),

    async execute(interaction) {
        // Check if we're in the correct channel
        if (!(await checkChannel(interaction))) {
            return;
        }

        try {
            const configPath = path.join(__dirname, '../../database/config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            if (!config.tournament?.isActive) {
                return interaction.reply({
                    content: 'No tournament is currently running.',
                    ephemeral: true
                });
            }

            const tournamentListPath = path.join(__dirname, '../../database/tournament-list.json');
            const bracketPath = path.join(__dirname, '../../database/bracket.json');
            
            let participantCount = 0;
            let matches = [];

            if (fs.existsSync(tournamentListPath)) {
                const tournamentList = JSON.parse(fs.readFileSync(tournamentListPath, 'utf8'));
                participantCount = tournamentList.participants.length;
            }

            if (fs.existsSync(bracketPath)) {
                const bracketData = JSON.parse(fs.readFileSync(bracketPath, 'utf8'));
                matches = bracketData.matches || [];
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Tournament Status')
                .setDescription(config.tournament.name)
                .addFields(
                    {
                        name: 'Phase',
                        value: config.tournament.isRegistrationOpen ? '📝 Registration Open' : '🎮 Tournament In Progress'
                    },
                    {
                        name: 'Format',
                        value: config.tournament.format.charAt(0).toUpperCase() + config.tournament.format.slice(1)
                    },
                    {
                        name: 'Participants',
                        value: `${participantCount}/${config.tournament.maxParticipants}`
                    }
                );

            if (!config.tournament.isRegistrationOpen) {
                // Add match statistics if tournament has started
                const completedMatches = matches.filter(m => m.winner).length;
                const totalMatches = matches.length;
                
                embed.addFields({
                    name: 'Match Progress',
                    value: totalMatches > 0 
                        ? `${completedMatches}/${totalMatches} matches completed`
                        : 'Brackets not yet generated'
                });
            }

            // Add available commands based on current phase
            let availableCommands = '';
            if (config.tournament.isRegistrationOpen) {
                availableCommands = '`/t-join` - Join the tournament\n' +
                                  '`/t-leave` - Leave the tournament\n' +
                                  '`/t-list` - View participants';
            } else {
                availableCommands = '`/t-list` - View participants\n' +
                                  '`/t-bracket` - View brackets\n' +
                                  '`/t-report` - Report match results';
            }

            embed.addFields({
                name: 'Available Commands',
                value: availableCommands
            });

            // Add tournament info
            const createdTime = new Date(config.tournament.createdAt);
            embed.addFields({
                name: 'Tournament Info',
                value: `Created: <t:${Math.floor(createdTime.getTime() / 1000)}:R>`
            });

            if (config.tournament.startedAt) {
                const startedTime = new Date(config.tournament.startedAt);
                embed.addFields({
                    name: 'Started',
                    value: `<t:${Math.floor(startedTime.getTime() / 1000)}:R>`
                });
            }

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in tournament-status command:', error);
            return interaction.reply({
                content: 'There was an error while checking tournament status.',
                ephemeral: true
            });
        }
    },
};
