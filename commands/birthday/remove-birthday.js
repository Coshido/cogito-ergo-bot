const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday-remove')
        .setDescription('Remove your birthday from the server celebrations'),

    async execute(interaction) {
        try {
            const dbPath = path.join(__dirname, '../../database/birthday-data.json');
            const data = JSON.parse(await fs.readFile(dbPath, 'utf8'));

            // Check if user has a birthday set
            if (!data.birthdays[interaction.user.id]) {
                return interaction.reply({ 
                    content: "You don't have a birthday set!", 
                    ephemeral: true 
                });
            }

            // Remove the birthday
            delete data.birthdays[interaction.user.id];
            await fs.writeFile(dbPath, JSON.stringify(data, null, 4));
            
            await interaction.reply({ 
                content: 'Your birthday has been removed! 🗑️', 
                ephemeral: true 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error removing your birthday!', 
                ephemeral: true 
            });
        }
    },
}; 