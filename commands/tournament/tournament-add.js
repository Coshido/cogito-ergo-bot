const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tournament-add')
		.setDescription('Add user to the tournament list.'),
       
      execute(interaction) {
        console.log(interaction.member.roles.cache.filter(role => role.name == 'Mods') ? 'true' : "false")
		interaction.reply(`channel ${interaction.channel}, channelId ${interaction.channel.id}, member ${interaction.member.roles}`)
		
	}, 
};