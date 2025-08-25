const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getCurrentWeekMonday, loadReservations, ensureCurrentWeekReservations } = require('../../utils/reservation-utils');
const { isRaidLeader } = require('../../utils/permission-utils');
const ImageComposer = require('../../utils/image-composer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-list')
        .setDescription('Mostra tutte le reserve della settimana organizzate per boss')
        .addBooleanOption(opt =>
            opt
                .setName('image')
                .setDescription('Genera immagini per boss con icone degli oggetti e nomi dei prenotanti')
                .setRequired(false)
        ),

    async execute(interaction) {
        // Check if user is a raid leader
        if (!isRaidLeader(interaction.member)) {
            return interaction.reply({
                content: 'Solo i Raid Leader possono visualizzare la lista delle reserve.',
                ephemeral: true
            });
        }

        const currentWeek = getCurrentWeekMonday();
        const reservations = loadReservations();
        ensureCurrentWeekReservations(reservations);
        const itemReservations = {};

        // Read raid loot data
        const raidData = JSON.parse(fs.readFileSync(
            path.join(__dirname, '../../database/raid-loot.json'),
            'utf8'
        ));

        // Initialize the map with all bosses and their items, tracking image_url
        raidData.bosses.forEach(boss => {
            itemReservations[boss.name] = {};
            boss.loot.forEach(item => {
                // Exclude any cosmetic items globally (covers Naazindhri's cosmetic drop)
                const typeStr = (item.type || '').toString();
                if (/cosmetic|cosmetico/i.test(typeStr)) {
                    return; // skip cosmetic
                }

                // Keep reservation key as original item name for compatibility
                // But compute a display name that includes token classes if available
                let displayName = item.name;
                const tokenClasses = Array.isArray(item.tokenClasses) ? item.tokenClasses : undefined;
                const isToken = /\btoken\b/i.test(typeStr) || (Array.isArray(tokenClasses) && tokenClasses.length > 0);
                if (isToken && tokenClasses && tokenClasses.length > 0) {
                    displayName = `${item.name} — Classi: ${tokenClasses.join(', ')}`;
                }

                itemReservations[boss.name][item.name] = {
                    image_url: item.image_url,
                    display_name: displayName,
                    reservers: []
                };
            });
        });

        // Fill in the reservations
        Object.entries(reservations.weekly_reservations[currentWeek] || {}).forEach(([userId, userData]) => {
            userData.items.forEach(item => {
                if (itemReservations[item.boss]?.[item.name]) {
                    itemReservations[item.boss][item.name].reservers.push({
                        userId: userId,
                        characterName: userData.character_name
                    });
                }
            });
        });

        const guild = interaction.guild;
        const useImage = interaction.options.getBoolean('image') === true;

        if (useImage) {
            // Prepare per-boss image payloads
            const bossPayloads = [];
            for (const [bossName, items] of Object.entries(itemReservations)) {
                const itemsList = Object.entries(items)
                    .filter(([_, info]) => info.reservers && info.reservers.length > 0)
                    .map(([itemName, info]) => {
                        return {
                            name: info.display_name || itemName,
                            image_url: info.image_url,
                            reservers: info.reservers.map(r => {
                                const member = guild.members.cache.get(r.userId);
                                const username = member ? member.user.username : 'Utente Sconosciuto';
                                return { username, characterName: r.characterName };
                            })
                        };
                    });

                if (itemsList.length > 0) {
                    const buffer = await ImageComposer.createBossReservationsImage(bossName, itemsList);
                    const safeBoss = bossName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    const fileName = `reservations_${safeBoss}.png`;
                    const attachment = new AttachmentBuilder(buffer, { name: fileName });
                    const embed = new EmbedBuilder()
                        .setColor('#87CEEB')
                        .setTitle(bossName.toUpperCase())
                        .setImage(`attachment://${fileName}`)
                        .setFooter({ text: `Settimana del ${currentWeek}` });
                    bossPayloads.push({ embed, attachment });
                }
            }

            if (bossPayloads.length === 0) {
                await interaction.reply({ content: 'Nessuna reserve per questa settimana!', ephemeral: true });
                return;
            }

            // Send in chunks of up to 10 embeds/attachments per message
            const chunkSize = 10;
            for (let i = 0; i < bossPayloads.length; i += chunkSize) {
                const chunk = bossPayloads.slice(i, i + chunkSize);
                const embeds = chunk.map(p => p.embed);
                const files = chunk.map(p => p.attachment);
                if (i === 0) {
                    await interaction.reply({ content: 'Tutte le reserve della settimana (immagini)', embeds, files, ephemeral: true });
                } else {
                    await interaction.followUp({ embeds, files, ephemeral: true });
                }
            }
            return;
        }

        // Text mode (default)
        let description = '';
        for (const [bossName, items] of Object.entries(itemReservations)) {
            const bossItems = Object.entries(items)
                .filter(([_, info]) => info.reservers && info.reservers.length > 0)
                .map(([itemName, info]) => {
                    const reserversList = info.reservers
                        .map(r => {
                            const member = guild.members.cache.get(r.userId);
                            const username = member ? member.user.username : 'Utente Sconosciuto';
                            return `└ ${username} (${r.characterName})`;
                        })
                        .join('\n');
                    const shownName = info.display_name || itemName;
                    return `${shownName}\n${reserversList}`;
                });

            if (bossItems.length > 0) {
                description += `\n\`\`\`ansi\n\u001b[2;34m${bossName.toUpperCase()}\u001b[0m\n\`\`\`\n${bossItems.join('\n\n')}\n\n`;
            }
        }

        if (description.trim() === '') {
            await interaction.reply({ content: 'Nessuna reserve per questa settimana!', ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#87CEEB')
            .setTitle('Tutte le reserve della settimana')
            .setDescription(description)
            .setFooter({ text: `Settimana del ${currentWeek}` });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};