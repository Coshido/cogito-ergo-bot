const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function generateMatches(participants, format) {
    // Shuffle participants
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    // Calculate number of byes needed
    const roundSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));
    const byes = roundSize - participants.length;
    
    // Generate first round matches
    const matches = [];
    for (let i = 0; i < participants.length - byes; i += 2) {
        matches.push({
            player1: shuffled[i],
            player2: shuffled[i + 1],
            winner: null,
            round: 1,
            matchId: matches.length + 1
        });
    }
    
    // Add byes
    for (let i = participants.length - byes; i < participants.length; i++) {
        matches.push({
            player1: shuffled[i],
            player2: null, // bye
            winner: shuffled[i], // auto-win
            round: 1,
            matchId: matches.length + 1
        });
    }
    
    return matches;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tournament-bracket')
        .setDescription('Generate tournament brackets'),

    async execute(interaction) {
        try {
            // Check if user has the tournament manager role
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
                    content: 'Cannot generate brackets while registration is still open. Use `/tournament-start` to close registration and start the tournament.',
                    ephemeral: true
                });
            }

            // Only tournament managers can generate brackets
            if (!interaction.member.roles.cache.has(config.tournamentManagerRoleId)) {
                return interaction.reply({
                    content: 'Only tournament managers can generate brackets.',
                    ephemeral: true
                });
            }

            const tournamentPath = path.join(__dirname, '../../database/tournament-list.json');
            const bracketPath = path.join(__dirname, '../../database/bracket.json');
            const tournamentList = JSON.parse(fs.readFileSync(tournamentPath, 'utf8'));
            
            if (tournamentList.participants.length < 2) {
                return interaction.reply({
                    content: 'Need at least 2 participants to generate a bracket.',
                    ephemeral: true
                });
            }

            const matches = generateMatches(tournamentList.participants, config.tournament.format);
            fs.writeFileSync(bracketPath, JSON.stringify({ matches }, null, 2));

            // Create bracket display
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Tournament Bracket - Round 1')
                .setDescription('Use `/tournament-report` to report match results');

            for (const match of matches) {
                const player1 = match.player1?.username || 'BYE';
                const player2 = match.player2?.username || 'BYE';
                embed.addFields({
                    name: `Match #${match.matchId}`,
                    value: `${player1} vs ${player2}${match.winner ? ` (Winner: ${match.winner.username})` : ''}`
                });
            }

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in tournament-bracket command:', error);
            return interaction.reply({
                content: 'There was an error while managing the bracket.',
                ephemeral: true
            });
        }
    },
};
