const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const LeagueManager = require('../../utils/league-utils');
const { isAdminOrAuthorizedUser } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league-match-report')
        .setDescription('Report a league match result')
        .addStringOption(option => 
            option.setName('team1')
                .setDescription('First team name')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('team2')
                .setDescription('Second team name')
                .setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName('team1_score')
                .setDescription('Score for first team')
                .setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName('team2_score')
                .setDescription('Score for second team')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Check admin or authorized user permissions
        if (!isAdminOrAuthorizedUser(interaction)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        try {
            const team1 = interaction.options.getString('team1');
            const team2 = interaction.options.getString('team2');
            const team1Score = interaction.options.getInteger('team1_score');
            const team2Score = interaction.options.getInteger('team2_score');

            // Report match result
            const result = await LeagueManager.reportMatchResult(team1, team2, team1Score, team2Score);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Match Result Reported')
                .setDescription(`Match between ${team1} and ${team2} has been recorded.`)
                .addFields(
                    { name: `${team1} Score`, value: team1Score.toString(), inline: true },
                    { name: `${team2} Score`, value: team2Score.toString(), inline: true }
                );

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Match report error:', error);
            await interaction.reply({
                content: `Error reporting match: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
