const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkChannel } = require('../../utils/tournamentUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('t-start')
        .setDescription('Start the tournament and close registration'),

    async execute(interaction) {
        // Check if we're in the correct channel
        if (!(await checkChannel(interaction))) {
            return;
        }

        try {
            const configPath = path.join(__dirname, '../../database/config.json');
            let config = {};
            
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(data);
            }
            
            if (!config.tournament?.isActive) {
                return interaction.reply({
                    content: 'No tournament is currently running.',
                    ephemeral: true
                });
            }

            if (!config.tournament.isRegistrationOpen) {
                return interaction.reply({
                    content: 'Tournament has already started.',
                    ephemeral: true
                });
            }

            // Check if user has the tournament manager role
            if (!interaction.member.roles.cache.has(config.tournamentManagerRoleId)) {
                return interaction.reply({
                    content: 'Only tournament managers can start the tournament.',
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

            if (tournamentList.participants.length < 2) {
                return interaction.reply({
                    content: 'Need at least 2 participants to start the tournament.',
                    ephemeral: true
                });
            }

            // Close registration and update tournament status
            config.tournament.isRegistrationOpen = false;
            config.tournament.startedAt = new Date().toISOString();
            config.tournament.startedBy = interaction.user.id;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Tournament Started! 🎮')
                .setDescription(`${config.tournament.name} has begun!`)
                .addFields(
                    {
                        name: 'Participants',
                        value: `${tournamentList.participants.length} players`
                    },
                    {
                        name: 'Format',
                        value: config.tournament.format.charAt(0).toUpperCase() + config.tournament.format.slice(1)
                    },
                    {
                        name: 'Next Steps',
                        value: 'Tournament managers can now use `/t-bracket` to generate the tournament brackets.'
                    }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in tournament-start command:', error);
            return interaction.reply({
                content: 'There was an error while starting the tournament.',
                ephemeral: true
            });
        }
    },
};
