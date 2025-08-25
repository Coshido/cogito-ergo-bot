const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Fornisce informazioni sull\'utente.'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		await interaction.reply(`Questo comando è stato eseguito da ${interaction.user.username}, che si è unito il ${interaction.member.joinedAt}.`);
	},
};