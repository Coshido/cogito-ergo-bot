const { SlashCommandBuilder } = require('discord.js');
const { AttachmentBuilder } = require('discord.js');
const WeakAuraGenerator = require('../../utils/weakaura-generator');
const { loadReservations } = require('../../utils/reservation-utils');
const { isRaidLeader } = require('../../utils/permission-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reserve-generate')
        .setDescription('Genera una WeakAura per le prenotazioni di bottino attuali'),
    
    async execute(interaction) {
        // Check if user is a raid leader
        if (!isRaidLeader(interaction.member)) {
            return interaction.reply({
                content: 'Solo i Raid Leader possono generare le WeakAura.',
                ephemeral: true
            });
        }

        // Defer the reply to give more time for processing
        await interaction.deferReply({ ephemeral: true });

        try {
            console.log('Starting WeakAura Generation Command');
            
            // Load reservations
            const reservations = loadReservations();
            console.log('Loaded Reservations:', JSON.stringify(reservations, null, 2));

            // Attempt to generate WeakAura string
            console.log('Calling WeakAuraGenerator.generateLootReservationWA()');
            const waString = await WeakAuraGenerator.generateLootReservationWA(reservations);

            console.log('WeakAura generation successful');
            console.log('WeakAura string length:', waString.length);
            console.log('WeakAura string starts with:', waString.substring(0, 50));
            console.log('WeakAura string ends with:', waString.substring(waString.length - 50));

            // Validate WeakAura string
            if (!waString || waString.length < 10) {
                console.error('Generated WeakAura string is invalid');
                await interaction.editReply({
                    content: 'Impossibile generare la WeakAura: stringa non valida',
                    ephemeral: true
                });
                return;
            }

            // Create a text file with the WeakAura string
            const buffer = Buffer.from(waString, 'utf8');
            const attachment = new AttachmentBuilder(buffer, { name: 'LootReservations.txt' });

            await interaction.editReply({
                content: 'Ecco la stringa di importazione per WeakAura. Copia il contenuto del file e importalo in WeakAuras.',
                files: [attachment],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in reserve-generate command:', error);
            try {
                await interaction.editReply({
                    content: `Errore durante la generazione della WeakAura: ${error.message}`,
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    }
};