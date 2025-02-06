const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
require("dotenv").config();

console.log('Starting command deployment process');

// Validate environment variables
const requiredEnvVars = ['CLIENT_ID', 'GUILD_ID', 'BOT_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
}

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

const commands = [];

// Dynamically load commands with detailed error handling
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

console.log('Command folders found:', commandFolders);

commandFolders.forEach(folder => {
    const commandPath = path.join(__dirname, 'commands', folder);
    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

    console.log(`Processing folder: ${folder}, Files: ${commandFiles}`);

    commandFiles.forEach(file => {
        const filePath = path.join(commandPath, file);
        try {
            const command = require(filePath);
            
            // Validate command structure
            if (!command.data || !command.data.toJSON) {
                console.error(`Invalid command structure in ${file}. Missing 'data' or 'toJSON' method.`);
                return;
            }

            console.log(`Loaded command: ${command.data.name} from ${file}`);
            commands.push(command.data.toJSON());
        } catch (error) {
            console.error(`Error loading command from ${file}:`, error);
        }
    });
});

console.log(`Total commands loaded: ${commands.length}`);
console.log('Command names:', commands.map(cmd => cmd.name));

const rest = new REST().setToken(token);

async function deployCommands() {
    try {
        console.log(`Deploying ${commands.length} application (/) commands to guild ${guildId}`);
        console.log('Commands:', commands.map(cmd => cmd.name).join(', '));

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log(`Successfully deployed ${data.length} commands`);
        return data;
    } catch (error) {
        console.error('Failed to deploy commands:', error);
        
        // Additional detailed error logging
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        
        throw error;
    }
}

// Main execution
(async () => {
    try {
        await deployCommands();
        console.log('Command deployment completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
})();