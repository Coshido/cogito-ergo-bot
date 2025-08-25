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
            const dbPath = path.join(__dirname, '../../database/birthday-data.json');
            
            // Read existing data or create new
            let data = { birthdays: {}, settings: {} };
            if (await fs.access(dbPath).then(() => true).catch(() => false)) {
                data = JSON.parse(await fs.readFile(dbPath, 'utf8'));
            }

            // Ensure settings object exists
            if (!data.settings) {
                data.settings = {};
            }

            // Update birthday channel
            data.settings.announcementChannelId = channel.id;

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