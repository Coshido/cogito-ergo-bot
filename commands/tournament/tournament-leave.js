const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { checkChannel } = require('../../utils/tournamentUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('t-leave')
        .setDescription('Leave the current tournament'),

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

            if (!config.tournament.isRegistrationOpen) {
                return interaction.reply({
                    content: 'Cannot leave the tournament after it has started.',
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

            const participantIndex = tournamentList.participants.findIndex(p => p.id === interaction.user.id);
            if (participantIndex === -1) {
                return interaction.reply({
                    content: 'You are not registered in the tournament.',
                    ephemeral: true
                });
            }

            // Remove the participant
            tournamentList.participants.splice(participantIndex, 1);
            fs.writeFileSync(tournamentListPath, JSON.stringify(tournamentList, null, 2));

            return interaction.reply({
                content: `You have been removed from the tournament. Total participants: ${tournamentList.participants.length}/${config.tournament.maxParticipants}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in tournament-leave command:', error);
            return interaction.reply({
                content: 'There was an error while removing you from the tournament.',
                ephemeral: true
            });
        }
    },
};
