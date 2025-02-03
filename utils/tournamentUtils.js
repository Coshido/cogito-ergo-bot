const fs = require('node:fs');
const path = require('node:path');

function getConfig() {
    const configPath = path.join(__dirname, '../database/config.json');
    if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    }
    return {};
}

function isCorrectChannel(interaction) {
    const config = getConfig();
    
    // If no channel is configured, allow commands in any channel
    if (!config.tournamentChannelId) {
        return true;
    }

    // Allow configuration commands in any channel
    if (interaction.commandName === 't-config') {
        return true;
    }

    // For all other commands, check if we're in the correct channel
    return interaction.channelId === config.tournamentChannelId;
}

async function checkChannel(interaction) {
    if (!isCorrectChannel(interaction)) {
        const config = getConfig();
        const channel = await interaction.guild.channels.fetch(config.tournamentChannelId);
        await interaction.reply({
            content: `This command can only be used in ${channel}`,
            ephemeral: true
        });
        return false;
    }
    return true;
}

module.exports = {
    getConfig,
    isCorrectChannel,
    checkChannel
};
