const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const BirthdayHandler = require('./utils/birthday/birthday-handler');
const ReminderService = require('./services/reminder-service');
const { initializeDatabase } = require('./utils/database-init');

// required to access .env
require("dotenv").config();

const token = process.env.BOT_TOKEN

const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    ]
});

// setting up command helper
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath)
		.filter(file => file.endsWith('.js'))
		.filter(file => !['index.js', 'birthday-handler.js'].includes(file));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	
	// Initialize birthday handler
	const birthdayHandler = new BirthdayHandler(client);
	birthdayHandler.startChecking();
	
	// Initialize reminder service
	const reminderService = new ReminderService(client);
	reminderService.startReminderScheduler();
	
	console.log('Birthday and reminder handlers initialized!');
});

// Initialize database before starting the bot
(async () => {
    try {
        console.log('Starting database initialization');
        console.log('Current working directory:', process.cwd());
        console.log('__dirname:', __dirname);
        console.log('Environment variables:');
        console.log('DATABASE_PATH:', process.env.DATABASE_PATH);
        
        // Ensure all required environment variables are present
        const requiredEnvVars = ['BOT_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error('Missing required environment variables:', missingVars);
            process.exit(1);
        }
        
        // Use the mounted volume path if available
        const databasePath = await initializeDatabase(process.env.DATABASE_PATH);
        console.log('Database initialized successfully at:', databasePath);
    } catch (error) {
        console.error('CRITICAL: Failed to initialize database:', error);
        
        // Log additional context about the error
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Ensure the process exits with an error code
        process.exit(1);
    }
})();

client.login(token)