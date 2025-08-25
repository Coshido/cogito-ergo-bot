const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isAdminOrAuthorizedUser } = require('../../utils/permission-utils');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'database', 'config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-setup')
        .setDescription('Configura i ruoli di Raid Leader e Raider')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option => 
            option.setName('raid_leader_role')
                .setDescription('Seleziona il ruolo Raid Leader')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('raider_role')
                .setDescription('Seleziona il ruolo Raider')
                .setRequired(true)),

    async execute(interaction) {
        // Check admin or authorized user permissions
        if (!isAdminOrAuthorizedUser(interaction)) {
            return interaction.reply({
                content: 'Non hai il permesso di usare questo comando.',
                ephemeral: true
            });
        }

        // Get the selected roles
        const raidLeaderRole = interaction.options.getRole('raid_leader_role');
        const raiderRole = interaction.options.getRole('raider_role');

        // Read existing config
        let config = {};
        try {
            config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) || {};
        } catch (error) {
            console.error('Error reading config file:', error);
            
            // Ensure the directory exists
            const configDir = path.dirname(CONFIG_PATH);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            // Create a default config file
            config = {
                raidLeaderRoleId: null,
                raiderRoleId: null
            };
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        }

        // Ensure config has all necessary properties
        config = {
            ...config,
            raidLeaderRoleId: null,
            raiderRoleId: null,
            ...config
        };

        // Update roles in config
        config.raidLeaderRoleId = raidLeaderRole.id;
        config.raiderRoleId = raiderRole.id;

        // Write updated config
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

            await interaction.reply({
                content: `Ruolo Raid Leader impostato su ${raidLeaderRole.name} e ruolo Raider impostato su ${raiderRole.name}`,
                ephemeral: false
            });
        } catch (error) {
            console.error('Error writing config file:', error);
            await interaction.reply({
                content: `Errore durante la configurazione dei ruoli: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
