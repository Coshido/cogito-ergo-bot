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
const config = require('../../database/state/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Ottieni aiuto e informazioni sulle funzionalità del bot'),

    async execute(interaction) {
        // Check user roles and permissions
        const member = interaction.member;

        // Determine roles/visibility
        const isRaidLeader = !!(
            (config.raidLeaderRoleId && member.roles?.cache?.has(config.raidLeaderRoleId)) ||
            (Array.isArray(config.raidLeaderUserIds) && config.raidLeaderUserIds.includes(member.user.id))
        );
        const isRaider = !!(config.raiderRoleId && member.roles?.cache?.has(config.raiderRoleId));

        // Determine available features and commands
        const availableFeatures = [];
        const featureCommands = {};

        // Reservation Feature
        if (isRaider || isRaidLeader) {
            availableFeatures.push({
                value: 'reserve_help',
                label: 'Loot Reservation',
                emoji: '🎲'
            });
            featureCommands['reserve_help'] = {
                managerCommands: isRaidLeader ? [
                    '`/reserve-setup roles` — Configura i ruoli Raid Leader/Raider',
                    '`/reserve-setup user` — Gestisci l\'allowlist dei Raid Leader',
                    '`/reserve-clear` — Cancella tutte le reserve salvate',
                    '`/reserve-list` — Mostra tutte le reserve della settimana',
                    '`/reserve-generate` — Genera una WeakAura dalle reserve attuali'
                ] : [],
                participantCommands: [
                    '`/reserve` — Riserva fino a 2 oggetti dal raid corrente',
                    '`/reserve-edit` — Modifica le tue reserve della settimana',
                    '`/reserve-reminder` — Configura i promemoria delle tue reserve'
                ]
            };
        }

        // Birthday Feature (always listed; leader-only commands shown only to Raid Leaders)
        availableFeatures.push({
            value: 'birthday_help',
            label: 'Birthday Tracking',
            emoji: '🎂'
        });
        featureCommands['birthday_help'] = {
            adminCommands: isRaidLeader ? [
                '`/birthday-set-channel` — Imposta il canale per gli annunci di compleanno'
            ] : [],
            userCommands: [
                '`/birthday-set` — Imposta il tuo compleanno',
                '`/birthday-remove` — Rimuovi il tuo compleanno'
            ]
        };

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
                'reserve_help': () => {
                    const fields = [];
                    if (featureCommands['reserve_help'].managerCommands.length) {
                        fields.push({
                            name: 'Comandi Gestione',
                            value: featureCommands['reserve_help'].managerCommands.join('\n')
                        });
                    }
                    if (featureCommands['reserve_help'].participantCommands.length) {
                        fields.push({
                            name: 'Comandi Partecipanti',
                            value: featureCommands['reserve_help'].participantCommands.join('\n')
                        });
                    }
                    return new EmbedBuilder()
                        .setColor(0x9B59B6)
                        .setTitle('🎲 Loot Reservation')
                        .setDescription('Sistema di reserve per i raid')
                        .addFields(fields);
                },

                'birthday_help': () => {
                    const fields = [];
                    if (featureCommands['birthday_help'].adminCommands.length) {
                        fields.push({
                            name: 'Comandi Raid Leader',
                            value: featureCommands['birthday_help'].adminCommands.join('\n')
                        });
                    }
                    if (featureCommands['birthday_help'].userCommands.length) {
                        fields.push({
                            name: 'Comandi Utente',
                            value: featureCommands['birthday_help'].userCommands.join('\n')
                        });
                    }
                    return new EmbedBuilder()
                        .setColor(0xE67E22)
                        .setTitle('🎂 Compleanni')
                        .setDescription('Traccia e celebra i compleanni degli utenti del server')
                        .addFields(fields);
                }
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
