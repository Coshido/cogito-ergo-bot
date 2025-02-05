const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LeagueManager = require('../../utils/league-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league-participants')
        .setDescription('View current league participants'),

    async execute(interaction) {
        try {
            // Get all participants
            const participants = await LeagueManager.getParticipants();

            const embed = new EmbedBuilder()
                .setTitle('League Participants')
                .setDescription(
                    participants.length > 0 
                        ? participants.map((p, index) => 
                            `${index + 1}. ${p.username} (Registered: ${new Date(p.registeredAt).toLocaleDateString()})`
                        ).join('\n')
                        : 'No participants registered yet.'
                )
                .addFields(
                    { 
                        name: 'Total Participants', 
                        value: participants.length.toString() 
                    }
                )
                .setColor(0x3498DB);

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('League registration list error:', error);
            await interaction.reply({
                content: `Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
