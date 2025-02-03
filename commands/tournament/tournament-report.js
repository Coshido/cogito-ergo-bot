const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tournament-report')
        .setDescription('Report a match result')
        .addIntegerOption(option =>
            option
                .setName('match')
                .setDescription('Match number')
                .setRequired(true))
        .addUserOption(option =>
            option
                .setName('winner')
                .setDescription('Winner of the match')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const configPath = path.join(__dirname, '../../database/config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            if (!config.tournament?.isActive) {
                return interaction.reply({
                    content: 'No tournament is currently running.',
                    ephemeral: true
                });
            }

            if (config.tournament.isRegistrationOpen) {
                return interaction.reply({
                    content: 'Cannot report matches while registration is still open. The tournament has not started yet.',
                    ephemeral: true
                });
            }

            const bracketPath = path.join(__dirname, '../../database/bracket.json');
            if (!fs.existsSync(bracketPath)) {
                return interaction.reply({
                    content: 'No bracket has been generated yet. Ask a tournament manager to generate the bracket first.',
                    ephemeral: true
                });
            }

            const matchId = interaction.options.getInteger('match');
            const winner = interaction.options.getUser('winner');
            const bracket = JSON.parse(fs.readFileSync(bracketPath, 'utf8'));
            const match = bracket.matches.find(m => m.matchId === matchId);

            if (!match) {
                return interaction.reply({
                    content: 'Invalid match number.',
                    ephemeral: true
                });
            }

            if (match.winner) {
                return interaction.reply({
                    content: 'This match has already been reported.',
                    ephemeral: true
                });
            }

            // Verify the winner was actually in the match
            if (winner.id !== match.player1?.id && winner.id !== match.player2?.id) {
                return interaction.reply({
                    content: 'The specified winner was not in this match.',
                    ephemeral: true
                });
            }

            // Only allow participants or tournament managers to report matches
            const isManager = interaction.member.roles.cache.has(config.tournamentManagerRoleId);
            const isParticipant = interaction.member.roles.cache.has(config.tournamentRoleId);

            if (!isManager && !isParticipant) {
                return interaction.reply({
                    content: 'Only tournament participants or managers can report match results.',
                    ephemeral: true
                });
            }

            // Update the match
            match.winner = {
                id: winner.id,
                username: winner.username,
                reportedBy: {
                    id: interaction.user.id,
                    username: interaction.user.username
                },
                reportedAt: new Date().toISOString()
            };

            // Save the updated bracket
            fs.writeFileSync(bracketPath, JSON.stringify(bracket, null, 2));

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Match Result Reported')
                .addFields(
                    { name: 'Match', value: `#${matchId}` },
                    { name: 'Players', value: `${match.player1.username} vs ${match.player2.username}` },
                    { name: 'Winner', value: winner.username },
                    { name: 'Reported By', value: interaction.user.username }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in tournament-report command:', error);
            return interaction.reply({
                content: 'There was an error while reporting the match result.',
                ephemeral: true
            });
        }
    },
};
