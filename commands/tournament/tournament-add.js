const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');
const { checkChannel } = require('../../utils/tournamentUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('t-join')
        .setDescription('Join the current tournament'),
       
    async execute(interaction) {
        // Check if we're in the correct channel    
        if (!(await checkChannel(interaction))) {
            return;
        }

        try {
            // Check if tournament exists and registration is open
            const configPath = path.join(__dirname, '../../database/config.json');
            let config = {};
            
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(data);
            }

            if (!config.tournament?.isActive) {
                return interaction.reply({ 
                    content: 'No tournament is currently running.',
                    ephemeral: true 
                });
            }

            if (!config.tournament.isRegistrationOpen) {
                return interaction.reply({ 
                    content: 'Tournament registration is closed. The tournament has already started.',
                    ephemeral: true 
                });
            }

            // Check if user has the tournament role
            if (!config.tournamentRoleId) {
                return interaction.reply({ 
                    content: 'Tournament role has not been set. Please ask an administrator to set it using `/t-config set-tournament-role`', 
                    ephemeral: true 
                });
            }

            const hasRole = interaction.member.roles.cache.has(config.tournamentRoleId);
            
            if (!hasRole) {
                const role = interaction.guild.roles.cache.get(config.tournamentRoleId);
                return interaction.reply({ 
                    content: `You need the ${role.name} role to join tournaments!`, 
                    ephemeral: true 
                });
            }

            const tournamentListPath = path.join(__dirname, '../../database/tournament-list.json');
            
            // Ensure the database directory exists
            const databaseDir = path.join(__dirname, '../../database');
            if (!fs.existsSync(databaseDir)) {
                fs.mkdirSync(databaseDir, { recursive: true });
            }

            // Create tournament list file if it doesn't exist
            if (!fs.existsSync(tournamentListPath)) {
                fs.writeFileSync(tournamentListPath, JSON.stringify({ 
                    participants: [],
                    created_at: new Date().toISOString()
                }, null, 2));
            }

            // Read current tournament list
            const data = fs.readFileSync(tournamentListPath, 'utf8');
            const tournamentList = JSON.parse(data);

            // Check if tournament is full
            if (tournamentList.participants.length >= config.tournament.maxParticipants) {
                return interaction.reply({ 
                    content: 'Sorry, the tournament is full!',
                    ephemeral: true 
                });
            }

            // Check if user is already in the tournament
            if (tournamentList.participants.some(p => p.id === interaction.user.id)) {
                return interaction.reply({ 
                    content: 'You are already registered in the tournament!',
                    ephemeral: true 
                });
            }

            // Add the participant
            tournamentList.participants.push({
                id: interaction.user.id,
                username: interaction.user.username,
                addedAt: new Date().toISOString()
            });

            // Save updated list
            fs.writeFileSync(tournamentListPath, JSON.stringify(tournamentList, null, 2));

            return interaction.reply(`Successfully added you to the tournament! Total participants: ${tournamentList.participants.length}/${config.tournament.maxParticipants}`);
        } catch (error) {
            console.error('Error in tournament-add command:', error);
            return interaction.reply({ 
                content: 'There was an error while adding you to the tournament.',
                ephemeral: true 
            });
        }
    },
};