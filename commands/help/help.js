const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    ComponentType,
    PermissionFlagsBits
} = require('discord.js');
// Tournament and League features removed

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Ottieni aiuto e informazioni sulle funzionalità del bot'),

    async execute(interaction) {
        // Check user roles and permissions
        const member = interaction.member;

        // Determine available features and commands
        const availableFeatures = [];
        const featureCommands = {};

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
                content: 'Non hai i permessi per accedere alle funzionalità del bot.',
                ephemeral: true
            });
        }

        // Create the main help embed
        const helpEmbed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🤖 Guida alle Funzionalità del Bot')
            .setDescription('Seleziona una funzionalità qui sotto per maggiori informazioni!')
            .addFields(
                { 
                    name: '📋 Funzionalità Disponibili', 
                    value: availableFeatures.map(f => `• ${f.label}`).join('\n')
                },
                { 
                    name: '🆘 Come Usare', 
                    value: 'Usa il menu a tendina qui sotto per esplorare i comandi disponibili.' 
                }
            )
            .setFooter({ text: 'Seleziona una funzionalità per saperne di più!' });

        // Create a select menu for different features
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_feature_select')
            .setPlaceholder('Seleziona una funzionalità per ottenere aiuto')
            .addOptions(
                availableFeatures.map(feature => 
                    new StringSelectMenuOptionBuilder()
                        .setLabel(feature.label)
                        .setDescription(`Comandi per ${feature.label.toLowerCase()}`)
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
                    content: 'Non puoi usare il menu di aiuto di un altro utente.',
                    ephemeral: true
                });
                return;
            }

            // Create feature-specific help embeds
            const helpEmbeds = {
                'reserve_help': () => new EmbedBuilder()
                    .setColor(0x9B59B6)
                    .setTitle('🎲 Loot Reservation')
                    .setDescription('Sistema di reserve per i raid')
                    .addFields(
                        { 
                            name: 'Comandi Gestione', 
                            value: featureCommands['reserve_help'].managerCommands.join('\n') || 'Nessun comando di gestione disponibile'
                        },
                        { 
                            name: 'Comandi Partecipanti', 
                            value: featureCommands['reserve_help'].participantCommands.join('\n') || 'Nessun comando per i partecipanti disponibile'
                        }
                    ),

                'birthday_help': () => new EmbedBuilder()
                    .setColor(0xE67E22)
                    .setTitle('🎂 Compleanni')
                    .setDescription('Traccia e celebra i compleanni degli utenti del server')
                    .addFields(
                        { 
                            name: 'Comandi Admin', 
                            value: featureCommands['birthday_help'].adminCommands.join('\n') || 'Nessun comando admin disponibile'
                        },
                        { 
                            name: 'Comandi Utente', 
                            value: featureCommands['birthday_help'].userCommands.join('\n') || 'Nessun comando utente disponibile'
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
