const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const LeagueManager = require('../../utils/league-utils');
const LeagueConfig = require('../../utils/league-config');
const { isAdminOrAuthorizedUser } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league-setup')
        .setDescription('Set up a new round-robin league')
        .addStringOption(option => 
            option.setName('league-name')
                .setDescription('Name of the league')
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

        const leagueName = interaction.options.getString('league-name');
        
        try {
            // Retrieve participants from the database
            const participants = await LeagueManager.getParticipants();

            // Validate number of participants
            if (participants.length < 2) {
                return interaction.reply({
                    content: 'Not enough participants to create a league. At least 2 participants are required.',
                    ephemeral: true
                });
            }

            // Initialize league with participants from database
            const leagueData = await LeagueManager.initializeLeague(leagueName);

            // Create an embed to show league details
            const embed = new EmbedBuilder()
                .setTitle('League Setup')
                .setDescription(`League "${leagueName}" has been created!`)
                .addFields(
                    { 
                        name: 'Participants', 
                        value: leagueData.participants.join(', ') 
                    },
                    { 
                        name: 'Total Participants', 
                        value: leagueData.participants.length.toString() 
                    }
                )
                .setColor(0x00FF00);

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('League setup error:', error);
            await interaction.reply({
                content: `Error setting up league: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
