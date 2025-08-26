const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { isAdminOrAuthorizedUser } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday-set-channel')
        .setDescription('Imposta il canale per gli annunci di compleanno')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Il canale in cui inviare i messaggi di compleanno')
                .setRequired(true)),

    async execute(interaction) {
        // Check admin or authorized user permissions
        if (!isAdminOrAuthorizedUser(interaction)) {
            return interaction.reply({
                content: 'Non hai il permesso di usare questo comando.',
                ephemeral: true
            });
        }

        const channel = interaction.options.getChannel('channel');

        if (!channel.isTextBased()) {
            return interaction.reply({ content: 'Per favore seleziona un canale di testo!', ephemeral: true });
        }

        try {
            const dataDir = process.env.DATABASE_PATH
                ? path.resolve(process.env.DATABASE_PATH)
                : path.join(__dirname, '../../database');
            const dbPath = path.join(dataDir, 'birthday-data.json');
            
            // Read existing data or create new
            let data = { birthdays: {}, channels: {} };
            if (await fs.access(dbPath).then(() => true).catch(() => false)) {
                data = JSON.parse(await fs.readFile(dbPath, 'utf8'));
            }

            // Ensure channels object exists
            if (!data.channels) {
                data.channels = {};
            }

            // Update birthday channel for this guild
            data.channels[interaction.guildId] = channel.id;

            // Write updated data
            await fs.writeFile(dbPath, JSON.stringify(data, null, 2));

            await interaction.reply({ 
                content: `Gli annunci di compleanno verranno inviati in ${channel}! 🎉`, 
                ephemeral: false 
            });
        } catch (error) {
            console.error('Birthday channel setup error:', error);
            await interaction.reply({ 
                content: `Errore durante l'impostazione del canale dei compleanni: ${error.message}`, 
                ephemeral: true 
            });
        }
    }
};