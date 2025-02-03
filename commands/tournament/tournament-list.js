const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkChannel } = require('../../utils/tournamentUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('t-list')
        .setDescription('List all tournament participants'),

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
            if (!fs.existsSync(tournamentListPath)) {
                return interaction.reply({
                    content: 'No tournament participants found.',
                    ephemeral: true
                });
            }

            const data = fs.readFileSync(tournamentListPath, 'utf8');
            const tournamentList = JSON.parse(data);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Tournament Participants (${tournamentList.participants.length}/${config.tournament.maxParticipants})`)
                .setDescription(config.tournament.name)
                .addFields(
                    {
                        name: 'Status',
                        value: config.tournament.isRegistrationOpen ? '📝 Registration Open' : '🎮 Tournament In Progress'
                    },
                    {
                        name: 'Format',
                        value: config.tournament.format.charAt(0).toUpperCase() + config.tournament.format.slice(1)
                    }
                );

            if (tournamentList.participants.length === 0) {
                embed.addFields({
                    name: 'Participants',
                    value: 'No participants yet'
                });
            } else {
                // Sort participants by join time
                const sortedParticipants = [...tournamentList.participants].sort((a, b) => 
                    new Date(a.addedAt) - new Date(b.addedAt)
                );

                embed.addFields({
                    name: 'Participants',
                    value: sortedParticipants.map((p, i) => `${i + 1}. ${p.username}`).join('\n')
                });
            }

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in tournament-list command:', error);
            return interaction.reply({
                content: 'There was an error while listing tournament participants.',
                ephemeral: true
            });
        }
    },
};
