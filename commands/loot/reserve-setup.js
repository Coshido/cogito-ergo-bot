const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isAdminOrAuthorizedUser } = require('../../utils/permission-utils');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'database', 'config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-setup')
        .setDescription('Configura Reserve: ruoli RL/Raider e allowlist utenti')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        // Subcommand: roles (both options optional)
        .addSubcommand(sub =>
            sub
                .setName('roles')
                .setDescription('Imposta/aggiorna i ruoli di Raid Leader e Raider (opzionali)')
                .addRoleOption(option =>
                    option
                        .setName('raid_leader_role')
                        .setDescription('Ruolo Raid Leader')
                        .setRequired(false)
                )
                .addRoleOption(option =>
                    option
                        .setName('raider_role')
                        .setDescription('Ruolo Raider')
                        .setRequired(false)
                )
        )
        // Subcommand: user (manage allowlist)
        .addSubcommand(sub =>
            sub
                .setName('user')
                .setDescription('Gestisci allowlist Raid Leader: aggiungi/rimuovi o mostra elenco')
                .addUserOption(option =>
                    option
                        .setName('add')
                        .setDescription('Utente da aggiungere (o rimuovere se remove=true)')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('remove')
                        .setDescription('Se true, rimuove l\'utente specificato invece di aggiungerlo')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        // Permission check
        if (!isAdminOrAuthorizedUser(interaction)) {
            return interaction.reply({
                content: 'Non hai i permessi per eseguire questo comando.',
                ephemeral: true,
            });
        }

        // Load config
        let config = {};
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
                config = JSON.parse(raw || '{}');
            }
        } catch (e) {
            console.error('Errore lettura config.json:', e);
            config = {};
        }
        // Defaults
        config.raidLeaderUserIds = Array.isArray(config.raidLeaderUserIds) ? config.raidLeaderUserIds : [];

        const sub = interaction.options.getSubcommand();

        if (sub === 'roles') {
            const raidLeaderRole = interaction.options.getRole('raid_leader_role');
            const raiderRole = interaction.options.getRole('raider_role');
            const changes = [];

            if (raidLeaderRole) {
                config.raidLeaderRoleId = raidLeaderRole.id;
                changes.push(`Raid Leader -> ${raidLeaderRole.name}`);
            }
            if (raiderRole) {
                config.raiderRoleId = raiderRole.id;
                changes.push(`Raider -> ${raiderRole.name}`);
            }

            if (changes.length === 0) {
                return interaction.reply({
                    content: 'Nessun ruolo aggiornato (nessuna opzione fornita).',
                    ephemeral: true,
                });
            }

            try {
                fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
            } catch (e) {
                console.error('Errore salvataggio config.json:', e);
                return interaction.reply({ content: 'Errore nel salvataggio della configurazione.', ephemeral: true });
            }

            return interaction.reply({ content: `Ruoli aggiornati:\n- ${changes.join('\n- ')}`, ephemeral: true });
        }

        if (sub === 'user') {
            const user = interaction.options.getUser('add');
            const remove = interaction.options.getBoolean('remove') || false;

            // List allowlist if no user provided
            if (!user) {
                if (config.raidLeaderUserIds.length === 0) {
                    return interaction.reply({ content: 'Nessun utente in allowlist Raid Leader.', ephemeral: true });
                }
                try {
                    const names = await Promise.all(
                        config.raidLeaderUserIds.map(async id => {
                            try {
                                const u = await interaction.client.users.fetch(id);
                                return `${u.tag} (${id})`;
                            } catch {
                                return `(sconosciuto) (${id})`;
                            }
                        })
                    );
                    return interaction.reply({ content: `Allowlist Raid Leader:\n- ${names.join('\n- ')}` , ephemeral: true });
                } catch (e) {
                    console.error('Errore durante il fetch degli utenti allowlist:', e);
                    return interaction.reply({ content: 'Impossibile recuperare la lista utenti.', ephemeral: true });
                }
            }

            // Add or remove
            const list = new Set(Array.from(config.raidLeaderUserIds));
            let msg;
            if (remove) {
                const had = list.delete(user.id);
                config.raidLeaderUserIds = Array.from(list);
                msg = had
                    ? `Utente rimosso dall'allowlist: ${user.tag} (${user.id})`
                    : `Utente non presente in allowlist: ${user.tag} (${user.id})`;
            } else {
                if (!list.has(user.id)) list.add(user.id);
                config.raidLeaderUserIds = Array.from(list);
                msg = `Utente aggiunto all'allowlist: ${user.tag} (${user.id})`;
            }

            try {
                fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
            } catch (e) {
                console.error('Errore salvataggio config.json:', e);
                return interaction.reply({ content: 'Errore nel salvataggio della configurazione.', ephemeral: true });
            }

            return interaction.reply({ content: msg, ephemeral: true });
        }

        // Fallback (should not happen)
        return interaction.reply({ content: 'Sotto-comando non riconosciuto.', ephemeral: true });
    }
};
