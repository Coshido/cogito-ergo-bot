// required to access .env
require("dotenv").config();
const {Client,Events, GatewayIntentBits} = require("discord.js")


const token = process.env.BOT_TOKEN

const client = new Client({intents: [GatewayIntentBits.Guilds]});

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});


client.login(token)