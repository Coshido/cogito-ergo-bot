const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    ComponentType,
    PermissionFlagsBits
} = require('discord.js');
const TournamentConfig = require('../../utils/tournamentUtils');
const LeagueConfig = require('../../utils/league-config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help and information about bot features'),

    async execute(interaction) {
        // Check user roles and permissions
        const member = interaction.member;

        // Helper function to check role-based permissions
        const checkTournamentManagerRole = async () => {
            try {
                // For tournament, check if the user can access tournament configuration
                const config = TournamentConfig.getConfig();
                return config.tournamentManagerRoleId 
                    ? member.roles.cache.has(config.tournamentManagerRoleId)
                    : member.permissions.has(PermissionFlagsBits.ManageEvents);
            } catch {
                return false;
            }
        };

        // Determine available features and commands
        const availableFeatures = [];
        const featureCommands = {};

        // Tournament Feature
        const isTournamentManager = await checkTournamentManagerRole();
        if (isTournamentManager) {
            availableFeatures.push({
                value: 'tournament_help',
                label: 'Tournament Management',
                emoji: '🏆'
            });
            featureCommands['tournament_help'] = {
                managerCommands: [
                    '`/t-config set-manager-role`',
                    '`/t-config set-tournament-role`',
                    '`/t-create`',
                    '`/t-start`',
                    '`/t-end`',
                    '`/t-bracket`'
                ],
                participantCommands: [
                    '`/t-join`',
                    '`/t-leave`',
                    '`/t-list`',
                    '`/t-report`'
                ]
            };
        }

        // League Feature
        const isLeagueManager = await LeagueConfig.isLeagueManager(member);
        console.log('League Manager Check:', {
            isLeagueManager,
            userId: member.id,
            username: member.user.username,
            roleIds: Array.from(member.roles.cache.keys())
        });
        if (isLeagueManager) {
            availableFeatures.push({
                value: 'league_help',
                label: 'League Management',
                emoji: '⚽'
            });
            featureCommands['league_help'] = {
                managerCommands: [
                    '`/league-role-setup manager`',
                    '`/league-role-setup participant`',
                    '`/league-setup`',
                    '`/league-match-report`',
                    '`/league-info`'
                ],
                participantCommands: [
                    '`/league-join`',
                    '`/league-leave`',
                    '`/league-participants`',
                    '`/league-info standings`',
                    '`/league-info schedule`'
                ]
            };
        }

        // Reservation Feature (placeholder, you'll need to implement this)
        const isReserveManager = member.permissions.has(PermissionFlagsBits.ManageRoles);
        if (isReserveManager) {
            availableFeatures.push({
                value: 'reserve_help',
                label: 'Loot Reservation',
                emoji: '🎲'
            });
            featureCommands['reserve_help'] = {
                managerCommands: [
                    '`/reserve-setup raid-leader-role`',
                    '`/reserve-setup raider-role`',
                    '`/reserve-clear`',
                    '`/reserve-list`'
                ],
                participantCommands: [
                    '`/reserve`',
                    '`/reserve-edit`',
                    '`/reserve-reminder`'
                ]
            };
        }

        // Birthday Feature (assuming admin-only)
        if (member.permissions.has(PermissionFlagsBits.Administrator)) {
            availableFeatures.push({
                value: 'birthday_help',
                label: 'Birthday Tracking',
                emoji: '🎂'
            });
            featureCommands['birthday_help'] = {
                adminCommands: [
                    '`/birthday-config channel`'
                ],
                userCommands: [
                    '`/birthday set`',
                    '`/birthday list`',
                    '`/birthday remove`'
                ]
            };
        }

        // If no features are available, send a message
        if (availableFeatures.length === 0) {
            return interaction.reply({
                content: 'You do not have permission to access any bot features.',
                ephemeral: true
            });
        }

        // Create the main help embed
        const helpEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🤖 Bot Feature Guide')
            .setDescription('Select a feature below to get detailed information!')
            .addFields(
                { 
                    name: '📋 Available Features', 
                    value: availableFeatures.map(f => `• ${f.label}`).join('\n')
                },
                { 
                    name: '🆘 How to Use', 
                    value: 'Use the dropdown menu below to explore your available commands.' 
                }
            )
            .setFooter({ text: 'Select a feature to learn more!' });

        // Create a select menu for different features
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_feature_select')
            .setPlaceholder('Select a feature to get help')
            .addOptions(
                availableFeatures.map(feature => 
                    new StringSelectMenuOptionBuilder()
                        .setLabel(feature.label)
                        .setDescription(`Commands for ${feature.label.toLowerCase()}`)
                        .setValue(feature.value)
                        .setEmoji(feature.emoji)
                )
            );

        // Create an action row with the select menu
        const actionRow = new ActionRowBuilder()
            .addComponents(selectMenu);

        // Send the initial help message
        const response = await interaction.reply({ 
            embeds: [helpEmbed], 
            components: [actionRow],
            ephemeral: true 
        });

        // Create a collector for interactions
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 3_600_000 // 1 hour
        });

        collector.on('collect', async (selectInteraction) => {
            // Ensure the interaction is from the original user
            if (selectInteraction.user.id !== interaction.user.id) {
                await selectInteraction.reply({
                    content: 'You cannot use someone else\'s help menu.',
                    ephemeral: true
                });
                return;
            }

            // Create feature-specific help embeds
            const helpEmbeds = {
                'tournament_help': () => new EmbedBuilder()
                    .setColor(0x2ECC71)
                    .setTitle('🏆 Tournament Management')
                    .setDescription('Comprehensive tournament organization commands')
                    .addFields(
                        { 
                            name: 'Manager Commands', 
                            value: featureCommands['tournament_help'].managerCommands.join('\n') || 'No manager commands available'
                        },
                        { 
                            name: 'Participant Commands', 
                            value: featureCommands['tournament_help'].participantCommands.join('\n') || 'No participant commands available'
                        }
                    ),

                'league_help': () => new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle('⚽ League Management')
                    .setDescription('Round-robin league tracking and management')
                    .addFields(
                        { 
                            name: 'Manager Commands', 
                            value: featureCommands['league_help'].managerCommands.join('\n') || 'No manager commands available'
                        },
                        { 
                            name: 'Participant Commands', 
                            value: featureCommands['league_help'].participantCommands.join('\n') || 'No participant commands available'
                        }
                    ),

                'reserve_help': () => new EmbedBuilder()
                    .setColor(0x9B59B6)
                    .setTitle('🎲 Loot Reservation')
                    .setDescription('Item reservation system for raids')
                    .addFields(
                        { 
                            name: 'Manager Commands', 
                            value: featureCommands['reserve_help'].managerCommands.join('\n') || 'No manager commands available'
                        },
                        { 
                            name: 'Participant Commands', 
                            value: featureCommands['reserve_help'].participantCommands.join('\n') || 'No participant commands available'
                        }
                    ),

                'birthday_help': () => new EmbedBuilder()
                    .setColor(0xE67E22)
                    .setTitle('🎂 Birthday Tracking')
                    .setDescription('Track and celebrate server birthdays')
                    .addFields(
                        { 
                            name: 'Admin Commands', 
                            value: featureCommands['birthday_help'].adminCommands.join('\n') || 'No admin commands available'
                        },
                        { 
                            name: 'User Commands', 
                            value: featureCommands['birthday_help'].userCommands.join('\n') || 'No user commands available'
                        }
                    )
            };

            const embed = helpEmbeds[selectInteraction.values[0]]();

            // Update the interaction with the feature-specific embed
            await selectInteraction.update({ 
                embeds: [embed], 
                components: [actionRow] 
            });
        });

        collector.on('end', async () => {
            // Disable the select menu after time expires
            const disabledActionRow = new ActionRowBuilder()
                .addComponents(
                    selectMenu.setDisabled(true)
                );

            try {
                await interaction.editReply({ 
                    components: [disabledActionRow] 
                });
            } catch (error) {
                console.error('Error disabling help menu:', error);
            }
        });
    }
};
