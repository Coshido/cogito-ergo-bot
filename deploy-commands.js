const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
require("dotenv").config();

console.log('Starting command deployment process');

// Flags
const isGlobal = process.argv.includes('--global');
const clearGlobal = process.argv.includes('--clear-global');
const clearGuild = process.argv.includes('--clear-guild');

if (clearGlobal && clearGuild) {
    console.error('Cannot use --clear-global and --clear-guild together.');
    process.exit(1);
}

if (clearGlobal) console.log('Deployment mode: CLEAR GLOBAL');
else if (clearGuild) console.log('Deployment mode: CLEAR GUILD');
else console.log('Deployment mode:', isGlobal ? 'GLOBAL' : 'GUILD');

// Validate environment variables (GUILD_ID required only for guild deploys)
const needsGuild = (!isGlobal) || clearGuild;
const requiredEnvVars = needsGuild
  ? ['CLIENT_ID', 'GUILD_ID', 'BOT_TOKEN']
  : ['CLIENT_ID', 'BOT_TOKEN'];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
}

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

let commands = [];

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
        // Clear scopes if requested
        if (clearGlobal) {
            console.log('Clearing GLOBAL application (/) commands (setting empty list)');
            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: [] }
            );
            console.log(`Successfully cleared ${Array.isArray(data) ? data.length : 0} GLOBAL commands`);
            return data;
        }
        if (clearGuild) {
            console.log(`Clearing application (/) commands for guild ${guildId} (setting empty list)`);
            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: [] }
            );
            console.log(`Successfully cleared ${Array.isArray(data) ? data.length : 0} GUILD commands`);
            return data;
        }

        if (isGlobal) {
            console.log(`Deploying ${commands.length} GLOBAL application (/) commands`);
            console.log('Commands:', commands.map(cmd => cmd.name).join(', '));

            const data = await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands }
            );

            console.log(`Successfully deployed ${data.length} GLOBAL commands`);
            return data;
        } else {
            console.log(`Deploying ${commands.length} application (/) commands to guild ${guildId}`);
            console.log('Commands:', commands.map(cmd => cmd.name).join(', '));

            const data = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            );

            console.log(`Successfully deployed ${data.length} GUILD commands`);
            return data;
        }
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