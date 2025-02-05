const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const LeagueConfig = require('../../utils/league-config');
const { isAdminOrAuthorizedUser } = require('../../utils/permission-utils');

// Define the specific user ID who can use this command
const AUTHORIZED_USER_ID = process.env.LEAGUE_ADMIN_USER_ID;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('league-role-setup')
        .setDescription('Configure league manager and participant roles')
        .addSubcommand(subcommand => 
            subcommand.setName('manager')
                .setDescription('Set the league manager role')
                .addRoleOption(option => 
                    option.setName('role')
                        .setDescription('Role for league managers')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand.setName('participant')
                .setDescription('Set the league participant role')
                .addRoleOption(option => 
                    option.setName('role')
                        .setDescription('Role for league participants')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Use the new permission utility function
        if (!isAdminOrAuthorizedUser(interaction)) {
            return interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
        }

        // Ensure only administrators can use this command
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: 'Only server administrators can configure league roles.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'manager') {
                // Get the selected role
                const role = interaction.options.getRole('role');

                // Save manager role
                await LeagueConfig.setManagerRole(role.id);

                const embed = new EmbedBuilder()
                    .setTitle('League Manager Role Set')
                    .setDescription(`League manager role set to: ${role.name}`)
                    .setColor(0x00FF00);

                await interaction.reply({ embeds: [embed], ephemeral: false });
            } 
            else if (subcommand === 'participant') {
                // Get the selected role
                const role = interaction.options.getRole('role');

                // Save participant role
                await LeagueConfig.setParticipantRole(role.id);

                const embed = new EmbedBuilder()
                    .setTitle('League Participant Role Set')
                    .setDescription(`League participant role set to: ${role.name}`)
                    .setColor(0x3498DB);

                await interaction.reply({ embeds: [embed], ephemeral: false });
            }
        } catch (error) {
            console.error('League role setup error:', error);
            await interaction.reply({
                content: `Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
