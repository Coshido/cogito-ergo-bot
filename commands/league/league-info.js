const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const LeagueManager = require('../../utils/league-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league-info')
        .setDescription('View league information')
        .addSubcommand(subcommand => 
            subcommand.setName('standings')
                .setDescription('View current league standings')
        )
        .addSubcommand(subcommand => 
            subcommand.setName('schedule')
                .setDescription('View league match schedule')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            const leagueData = await LeagueManager.loadLeagueData();

            if (!leagueData) {
                return interaction.reply({
                    content: 'No active league found. Use `/league-setup` to create one.',
                    ephemeral: true
                });
            }

            if (subcommand === 'standings') {
                // Create standings embed
                const standingsEmbed = new EmbedBuilder()
                    .setTitle(`🏆 ${leagueData.name} - League Standings`)
                    .setColor(0x00AE86)
                    .setDescription('Current League Standings')
                    .addFields(
                        { 
                            name: 'Standings', 
                            value: leagueData.standings.map((team, index) => 
                                `**${index + 1}. ${team.name}**\n` +
                                `Points: ${team.points} | Played: ${team.matchesPlayed}\n` +
                                `W/D/L: ${team.wins}/${team.draws}/${team.losses}\n` +
                                `GF/GA: ${team.goalsFor}/${team.goalsAgainst}`
                            ).join('\n\n')
                        }
                    );

                await interaction.reply({ embeds: [standingsEmbed] });
            } else if (subcommand === 'schedule') {
                // Separate matches into scheduled and completed
                const scheduledMatches = leagueData.matches.filter(m => m.status === 'scheduled');
                const completedMatches = leagueData.matches.filter(m => m.status === 'completed');

                // Create schedule embed
                const scheduleEmbed = new EmbedBuilder()
                    .setTitle(`🗓️ ${leagueData.name} - Match Schedule`)
                    .setColor(0x3498DB)
                    .addFields(
                        { 
                            name: 'Upcoming Matches', 
                            value: scheduledMatches.length > 0 
                                ? scheduledMatches.map(match => 
                                    `**${match.home}** vs **${match.away}** (Round ${match.round})`
                                ).join('\n')
                                : 'No upcoming matches'
                        },
                        { 
                            name: 'Completed Matches', 
                            value: completedMatches.length > 0
                                ? completedMatches.map(match => 
                                    `**${match.home}** ${match.result?.homeGoals || '?'} - ${match.result?.awayGoals || '?'} **${match.away}** (Round ${match.round})`
                                ).join('\n')
                                : 'No completed matches'
                        }
                    );

                await interaction.reply({ embeds: [scheduleEmbed] });
            }
        } catch (error) {
            console.error('League info error:', error);
            await interaction.reply({
                content: `Failed to retrieve league information: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
