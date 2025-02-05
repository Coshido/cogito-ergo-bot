const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LeagueManager = require('../../utils/league-utils');
const LeagueConfig = require('../../utils/league-config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league-join')
        .setDescription('Join the upcoming league'),

    async execute(interaction) {
        try {
            // Check if league participant role is set
            const config = await LeagueConfig.loadConfig();
            if (!config.participantRoleId) {
                return interaction.reply({
                    content: 'League participant role has not been set. Please contact an administrator.',
                    ephemeral: true
                });
            }

            // Assign participant role
            const participantRole = interaction.guild.roles.cache.get(config.participantRoleId);
            if (!participantRole) {
                return interaction.reply({
                    content: 'League participant role could not be found. Please contact an administrator.',
                    ephemeral: true
                });
            }

            // Add role to user
            await interaction.member.roles.add(participantRole);

            // Register the user
            const participants = await LeagueManager.addParticipant(
                interaction.user.id, 
                interaction.user.username
            );

            const embed = new EmbedBuilder()
                .setTitle('League Registration')
                .setDescription(`You have been registered for the league and assigned the ${participantRole.name} role!`)
                .addFields(
                    { 
                        name: 'Total Participants', 
                        value: participants.length.toString() 
                    }
                )
                .setColor(0x00FF00);

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('League join error:', error);
            await interaction.reply({
                content: `Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
