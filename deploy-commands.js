const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require("dotenv").config();

// Log environment variables for debugging
console.log('Environment Variables:');
console.log('CLIENT_ID:', process.env.CLIENT_ID ? 'SET' : 'UNSET');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'SET (masked)' : 'UNSET');

// Validate required environment variables
const requiredEnvVars = ['CLIENT_ID', 'BOT_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

const clientId = process.env.CLIENT_ID
const token = process.env.BOT_TOKEN

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

console.log('Command folders found:', commandFolders);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	
	if (!fs.statSync(commandsPath).isDirectory()) {
		console.log(`Skipping non-directory: ${commandsPath}`);
		continue;
	}

	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	console.log(`Commands in ${folder}:`, commandFiles);

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		try {
			const command = require(filePath);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
				console.log(`Loaded command: ${file}`);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		} catch (loadError) {
			console.error(`Error loading command ${file}:`, loadError);
		}
	}
}

const rest = new REST().setToken(token);

async function deployCommands() {
    try {
        console.log(`Deploying ${commands.length} application (/) commands`);
        console.log('Commands:', commands.map(cmd => cmd.name).join(', '));

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log(`Successfully deployed ${data.length} commands`);
        return data;
    } catch (error) {
        console.error('Failed to deploy commands:', error);
        throw error;
    }
}

(async () => {
    try {
        await deployCommands();
        console.log('Command deployment completed successfully');
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
})();