const { Events } = require('discord.js');
const HelpCommand = require('../commands/help/help');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle help command select menu interactions
        if (interaction.isStringSelectMenu() && interaction.customId === 'help_feature_select') {
            try {
                await HelpCommand.handleInteraction(interaction);
            } catch (error) {
                console.error('Help interaction error:', error);
                await interaction.reply({
                    content: 'Si è verificato un errore durante l\'elaborazione della tua richiesta di aiuto.',
                    ephemeral: true
                });
            }
        }
    }
};
