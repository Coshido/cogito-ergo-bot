const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday-set')
        .setDescription('Imposta il tuo compleanno per le celebrazioni nel server!')
        .addIntegerOption(option =>
            option.setName('day')
                .setDescription('Giorno del tuo compleanno')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(31))
        .addIntegerOption(option =>
            option.setName('month')
                .setDescription('Mese del tuo compleanno')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(12)),

    async execute(interaction) {
        const day = interaction.options.getInteger('day');
        const month = interaction.options.getInteger('month');

        // Validate date
        const date = new Date(2000, month - 1, day);
        if (date.getDate() !== day || date.getMonth() !== month - 1) {
            return interaction.reply({ content: 'Per favore inserisci una data valida!', ephemeral: true });
        }

        try {
            const dataDir = process.env.DATABASE_PATH
                ? path.resolve(process.env.DATABASE_PATH)
                : path.join(__dirname, '../../database');
            const dbPath = path.join(dataDir, 'birthday-data.json');
            const data = JSON.parse(await fs.readFile(dbPath, 'utf8'));

            // Ensure birthdays object exists
            if (!data.birthdays) {
                data.birthdays = {};
            }

            // Store birthday
            data.birthdays[interaction.user.id] = { day, month };
            await fs.writeFile(dbPath, JSON.stringify(data, null, 4));
            
            await interaction.reply({ content: `Il tuo compleanno è stato impostato al ${day}/${month}! 🎂`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Si è verificato un errore durante l\'impostazione del tuo compleanno!', ephemeral: true });
        }
    },
};