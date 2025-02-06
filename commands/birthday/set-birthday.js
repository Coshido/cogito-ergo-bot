const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday-set')
        .setDescription('Set your birthday for server celebrations!')
        .addIntegerOption(option =>
            option.setName('day')
                .setDescription('Day of your birthday')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(31))
        .addIntegerOption(option =>
            option.setName('month')
                .setDescription('Month of your birthday')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(12)),

    async execute(interaction) {
        const day = interaction.options.getInteger('day');
        const month = interaction.options.getInteger('month');

        // Validate date
        const date = new Date(2000, month - 1, day);
        if (date.getDate() !== day || date.getMonth() !== month - 1) {
            return interaction.reply({ content: 'Please enter a valid date!', ephemeral: true });
        }

        try {
            const dbPath = path.join(__dirname, '../../database/birthday-data.json');
            const data = JSON.parse(await fs.readFile(dbPath, 'utf8'));

            // Ensure birthdays object exists
            if (!data.birthdays) {
                data.birthdays = {};
            }

            // Store birthday
            data.birthdays[interaction.user.id] = { day, month };
            await fs.writeFile(dbPath, JSON.stringify(data, null, 4));
            
            await interaction.reply({ content: `Your birthday has been set to ${day}/${month}! 🎂`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error setting your birthday!', ephemeral: true });
        }
    },
}; 