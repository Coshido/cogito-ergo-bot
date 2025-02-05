const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const LeagueManager = require('../../utils/league-utils');
const { isRaider } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league-setup')
        .setDescription('Set up a new round-robin league')
        .addStringOption(option => 
            option.setName('league-name')
                .setDescription('Name of the league')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('participants')
                .setDescription('Comma-separated list of participants')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Check if user has permission
        if (!await isRaider(interaction.member)) {
            return interaction.reply({
                content: 'Only Raiders can set up a league.',
                ephemeral: true
            });
        }

        const leagueName = interaction.options.getString('league-name');
        const participantsInput = interaction.options.getString('participants');
        
        // Parse participants
        const participants = participantsInput.split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0);

        // Validate number of participants
        if (participants.length < 2) {
            return interaction.reply({
                content: 'You need at least 2 participants to create a league.',
                ephemeral: true
            });
        }

        try {
            // Initialize league
            const leagueData = await LeagueManager.initializeLeague(leagueName, participants);

            // Create an embed to show league details
            const embed = new EmbedBuilder()
                .setTitle(`🏆 ${leagueName} League Setup`)
                .setDescription('League successfully created!')
                .addFields(
                    { 
                        name: 'Participants', 
                        value: participants.join(', ') 
                    },
                    { 
                        name: 'Total Matches', 
                        value: leagueData.matches.length.toString() 
                    }
                )
                .setColor(0x00AE86);

            // Create buttons for additional actions
            const viewScheduleButton = new ButtonBuilder()
                .setCustomId('view_league_schedule')
                .setLabel('View Schedule')
                .setStyle(ButtonStyle.Primary);

            const viewStandingsButton = new ButtonBuilder()
                .setCustomId('view_league_standings')
                .setLabel('View Standings')
                .setStyle(ButtonStyle.Secondary);

            const actionRow = new ActionRowBuilder()
                .addComponents(viewScheduleButton, viewStandingsButton);

            // Send response
            await interaction.reply({
                embeds: [embed],
                components: [actionRow],
                ephemeral: false
            });
        } catch (error) {
            console.error('League setup error:', error);
            await interaction.reply({
                content: `Failed to set up league: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
