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

// Wrap the deployment in a function with a timeout
async function deployCommands() {
    return new Promise((resolve, reject) => {
        // Increase timeout to 2 minutes
        const deploymentTimer = setTimeout(() => {
            console.error('🕰️ Command deployment timed out');
            const timeoutError = new Error('Command deployment timed out after 120 seconds');
            timeoutError.name = 'DeploymentTimeoutError';
            reject(timeoutError);
        }, 120000);  // 2 minutes instead of 30 seconds

        (async () => {
            try {
                console.log('🚀 Starting comprehensive command deployment process');
                console.log('Environment variables:');
                console.log('CLIENT_ID:', clientId);
                console.log('Token present:', !!token);

                console.log(`🔍 Preparing to deploy ${commands.length} application (/) commands`);
                console.log('Commands to be deployed:', commands.map(cmd => cmd.name).join(', '));

                // Measure deployment time
                const startTime = Date.now();

                // Deploy commands GLOBALLY
                const data = await rest.put(
                    Routes.applicationCommands(clientId),
                    { body: commands },
                );

                const deploymentTime = (Date.now() - startTime) / 1000;
                console.log(`✅ Successfully deployed ${data.length} global application (/) commands`);
                console.log(`⏱️ Deployment took ${deploymentTime.toFixed(2)} seconds`);
                
                clearTimeout(deploymentTimer);
                resolve(data);
            } catch (error) {
                clearTimeout(deploymentTimer);
                console.error('❌ Command deployment failed:', error);
                reject(error);
            }
        })();
    });
}

async function clearAllGlobalCommands() {
    console.log('Starting to clear existing commands...');
    try {
        const rest = new REST().setToken(token);
        
        // Clear global commands
        const globalCommands = await rest.get(
            Routes.applicationCommands(clientId)
        );

        console.log(`Found ${globalCommands.length} global commands to clear`);
        for (const command of globalCommands) {
            await rest.delete(
                Routes.applicationCommand(clientId, command.id)
            );
            console.log(`Deleted global command: ${command.name}`);
        }

        console.log('All commands cleared successfully');
    } catch (error) {
        console.error('Error clearing commands:', error);
        throw error;
    }
}

// Main execution with comprehensive error handling
(async () => {
    try {
        // Clear existing commands first
        await clearAllGlobalCommands();
        
        // Then deploy new commands
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
        
        process.exit(1);
    }
})();