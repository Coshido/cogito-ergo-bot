const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday-remove')
        .setDescription('Rimuovi il tuo compleanno dalle celebrazioni del server'),

    async execute(interaction) {
        try {
            const dbPath = path.join(__dirname, '../../database/birthday-data.json');
            const data = JSON.parse(await fs.readFile(dbPath, 'utf8'));

            // Check if user has a birthday set
            if (!data.birthdays[interaction.user.id]) {
                return interaction.reply({ 
                    content: 'Non hai un compleanno impostato!', 
                    ephemeral: true 
                });
            }

            // Remove the birthday
            delete data.birthdays[interaction.user.id];
            await fs.writeFile(dbPath, JSON.stringify(data, null, 4));
            
            await interaction.reply({ 
                content: 'Il tuo compleanno è stato rimosso! 🗑️', 
                ephemeral: true 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'Si è verificato un errore durante la rimozione del tuo compleanno!', 
                ephemeral: true 
            });
        }
    },
};