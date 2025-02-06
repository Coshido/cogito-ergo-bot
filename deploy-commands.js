const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require("dotenv").config();

// Log environment variables for debugging
console.log('Environment Variables:');
console.log('CLIENT_ID:', process.env.CLIENT_ID ? 'SET' : 'UNSET');
console.log('GUILD_ID:', process.env.GUILD_ID ? 'SET' : 'UNSET');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'SET (masked)' : 'UNSET');

// Validate required environment variables
const requiredEnvVars = ['CLIENT_ID', 'GUILD_ID', 'BOT_TOKEN'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
}

const clientId = process.env.CLIENT_ID
const guildId = process.env.GUILD_ID
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

// Wrap the deployment in a function with a timeout
function deployCommands() {
	return new Promise((resolve, reject) => {
		// Set a timeout
		const deploymentTimer = setTimeout(() => {
			const timeoutError = new Error('Command deployment timed out after 30 seconds');
			timeoutError.name = 'DeploymentTimeoutError';
			reject(timeoutError);
		}, 30000);

		(async () => {
			try {
				console.log('Starting command deployment process');
				console.log('Environment variables:');
				console.log('CLIENT_ID:', clientId);
				console.log('GUILD_ID:', guildId);
				console.log('Token present:', !!token);

				console.log(`Started refreshing ${commands.length} application (/) commands.`);
				console.log('Commands to be deployed:', commands.map(cmd => cmd.name));

				const data = await rest.put(
					Routes.applicationGuildCommands(clientId, guildId),
					{ body: commands },
				);

				console.log(`Successfully reloaded ${data.length} application (/) commands.`);
				
				// Clear the timeout
				clearTimeout(deploymentTimer);
				resolve(data);
			} catch (error) {
				// Clear the timeout
				clearTimeout(deploymentTimer);
				reject(error);
			}
		})();
	});
}

// Main execution with comprehensive error handling
(async () => {
	try {
		await deployCommands();
		console.log('Command deployment completed successfully');
		process.exit(0);
	} catch (error) {
		console.error('Deployment failed:', error);
		
		// Log specific error details
		console.error('Error name:', error.name);
		console.error('Error message:', error.message);
		
		if (error.response) {
			console.error('Response status:', error.response.status);
			console.error('Response data:', error.response.data);
		}
		
		// Exit with error code
		process.exit(1);
	}
})();