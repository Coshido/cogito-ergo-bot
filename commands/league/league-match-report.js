const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const LeagueManager = require('../../utils/league-utils');
const { isRaider } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league-match-report')
        .setDescription('Submit a comprehensive match report')
        .addStringOption(option => 
            option.setName('home-team')
                .setDescription('Home team name')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('away-team')
                .setDescription('Away team name')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Check if user has permission
        if (!await isRaider(interaction.member)) {
            return interaction.reply({
                content: 'Only Raiders can record match results.',
                ephemeral: true
            });
        }

        const homeTeam = interaction.options.getString('home-team');
        const awayTeam = interaction.options.getString('away-team');

        // Create a modal for match result input
        const modal = new ModalBuilder()
            .setCustomId('record_match_result')
            .setTitle(`Match Result: ${homeTeam} vs ${awayTeam}`);

        // Create input fields for home and away team goals
        const homeGoalsInput = new TextInputBuilder()
            .setCustomId('home_goals')
            .setLabel(`${homeTeam} Goals`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter number of goals')
            .setRequired(true);

        const awayGoalsInput = new TextInputBuilder()
            .setCustomId('away_goals')
            .setLabel(`${awayTeam} Goals`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter number of goals')
            .setRequired(true);

        // Create action rows for the modal
        const homeGoalsRow = new ActionRowBuilder().addComponents(homeGoalsInput);
        const awayGoalsRow = new ActionRowBuilder().addComponents(awayGoalsInput);

        // Add components to modal
        modal.addComponents(homeGoalsRow, awayGoalsRow);

        // Show the modal
        await interaction.showModal(modal);

        // Wait for modal submission
        const modalSubmitInteraction = await interaction.awaitModalSubmit({
            filter: mi => mi.customId === 'record_match_result' && mi.user.id === interaction.user.id,
            time: 60000
        });

        // Parse goals
        const homeGoals = parseInt(modalSubmitInteraction.fields.getTextInputValue('home_goals'));
        const awayGoals = parseInt(modalSubmitInteraction.fields.getTextInputValue('away_goals'));

        // Validate goals input
        if (isNaN(homeGoals) || isNaN(awayGoals)) {
            return modalSubmitInteraction.reply({
                content: 'Invalid goals input. Please enter numeric values.',
                ephemeral: true
            });
        }

        try {
            // Find the specific match
            const leagueData = await LeagueManager.loadLeagueData();
            const matchToRecord = leagueData.matches.find(
                m => (m.home === homeTeam && m.away === awayTeam && m.status === 'scheduled')
            );

            if (!matchToRecord) {
                return modalSubmitInteraction.reply({
                    content: `No scheduled match found between ${homeTeam} and ${awayTeam}.`,
                    ephemeral: true
                });
            }

            // Record match result
            await LeagueManager.recordMatchResult(matchToRecord.id, {
                homeGoals,
                awayGoals
            });

            // Create result embed
            const resultEmbed = new EmbedBuilder()
                .setTitle('Match Result Recorded')
                .setDescription(`${homeTeam} ${homeGoals} - ${awayGoals} ${awayTeam}`)
                .setColor(homeGoals > awayGoals ? 0x00FF00 : (homeGoals < awayGoals ? 0xFF0000 : 0xFFFF00));

            // Reply with the result
            await modalSubmitInteraction.reply({
                embeds: [resultEmbed],
                ephemeral: false
            });
        } catch (error) {
            console.error('Match recording error:', error);
            await modalSubmitInteraction.reply({
                content: `Failed to record match result: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
