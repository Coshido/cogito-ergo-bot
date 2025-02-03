const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkChannel } = require('../../utils/tournamentUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('t-end')
        .setDescription('End the current tournament'),

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

            // Check if user has the tournament manager role
            if (!interaction.member.roles.cache.has(config.tournamentManagerRoleId)) {
                return interaction.reply({
                    content: 'Only tournament managers can end the tournament.',
                    ephemeral: true
                });
            }

            // Archive tournament data
            const archiveDir = path.join(__dirname, '../../database/archive');
            if (!fs.existsSync(archiveDir)) {
                fs.mkdirSync(archiveDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archivePath = path.join(archiveDir, `tournament-${timestamp}.json`);

            // Gather all tournament data
            const tournamentData = {
                config: config.tournament,
                endedAt: new Date().toISOString(),
                endedBy: interaction.user.id
            };

            // Add participant data if it exists
            const tournamentListPath = path.join(__dirname, '../../database/tournament-list.json');
            if (fs.existsSync(tournamentListPath)) {
                const participantData = JSON.parse(fs.readFileSync(tournamentListPath, 'utf8'));
                tournamentData.participants = participantData.participants;
            }

            // Add bracket data if it exists
            const bracketPath = path.join(__dirname, '../../database/bracket.json');
            if (fs.existsSync(bracketPath)) {
                const bracketData = JSON.parse(fs.readFileSync(bracketPath, 'utf8'));
                tournamentData.bracket = bracketData;
            }

            // Save archive
            fs.writeFileSync(archivePath, JSON.stringify(tournamentData, null, 2));

            // Clean up current tournament
            delete config.tournament;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            // Delete current tournament files
            if (fs.existsSync(tournamentListPath)) {
                fs.unlinkSync(tournamentListPath);
            }
            if (fs.existsSync(bracketPath)) {
                fs.unlinkSync(bracketPath);
            }

            const embed = new EmbedBuilder()
                .setColor(0xFF9900)
                .setTitle('Tournament Ended')
                .setDescription('The tournament has been archived and all data has been saved.')
                .addFields(
                    {
                        name: 'Archive Location',
                        value: `Saved to \`${path.relative(process.cwd(), archivePath)}\``
                    }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in tournament-end command:', error);
            return interaction.reply({
                content: 'There was an error while ending the tournament.',
                ephemeral: true
            });
        }
    },
};
