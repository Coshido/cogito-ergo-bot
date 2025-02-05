const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LeagueManager = require('../../utils/league-utils');
const LeagueConfig = require('../../utils/league-config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league-leave')
        .setDescription('Leave the upcoming league'),

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

            // Check if user has participant role
            const participantRole = interaction.guild.roles.cache.get(config.participantRoleId);
            if (!participantRole || !interaction.member.roles.cache.has(participantRole.id)) {
                return interaction.reply({
                    content: 'You are not a league participant.',
                    ephemeral: true
                });
            }

            // Remove participant role
            await interaction.member.roles.remove(participantRole);

            // Remove the user from participants list
            const participants = await LeagueManager.removeParticipant(interaction.user.id);

            const embed = new EmbedBuilder()
                .setTitle('League Registration')
                .setDescription(`You have been removed from the league and the ${participantRole.name} role has been removed.`)
                .addFields(
                    { 
                        name: 'Remaining Participants', 
                        value: participants.length.toString() 
                    }
                )
                .setColor(0xFF0000);

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('League leave error:', error);
            await interaction.reply({
                content: `Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
