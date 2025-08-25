const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Fornisce informazioni sul server.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		await interaction.reply(`Questo server è ${interaction.guild.name} e ha ${interaction.guild.memberCount} membri.`);
	},
};