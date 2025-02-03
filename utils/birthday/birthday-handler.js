const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class BirthdayHandler {
    constructor(client) {
        this.client = client;
        this.checkBirthdays = this.checkBirthdays.bind(this);
        this.dbPath = path.join(__dirname, '../../database/birthday-data.json');
    }

    async loadData() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, create default structure
            const defaultData = { birthdays: {}, channels: {} };
            await fs.writeFile(this.dbPath, JSON.stringify(defaultData, null, 4));
            return defaultData;
        }
    }

    async saveData(data) {
        await fs.writeFile(this.dbPath, JSON.stringify(data, null, 4));
    }

    async checkBirthdays() {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;

        try {
            const data = await this.loadData();
            const { birthdays, channels } = data;

            // Find today's birthdays
            const todaysBirthdays = Object.entries(birthdays).filter(([_, bday]) => 
                bday.day === currentDay && bday.month === currentMonth
            );

            // Send messages to each guild's birthday channel
            for (const [guildId, channelId] of Object.entries(channels)) {
                const channel = await this.client.channels.fetch(channelId);
                if (!channel) continue;

                for (const [userId, _] of todaysBirthdays) {
                    try {
                        const member = await channel.guild.members.fetch(userId);
                        if (!member) continue;

                        const embed = new EmbedBuilder()
                            .setColor('#FF69B4')
                            .setTitle('🎂 Auguri! 🎉')
                            .setDescription(`Oggi è il compleanno di ${member}! 🎈\nTi auguriamo un felice compleanno! 🎊`)
                            .setTimestamp();

                        await channel.send({ content: `Auguri ${member}! 🎂`, embeds: [embed] });
                    } catch (error) {
                        console.error(`Error sending birthday message for user ${userId}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error in birthday handler:', error);
        }
    }

    startChecking() {
        // Check every day at midnight
        setInterval(this.checkBirthdays, 24 * 60 * 60 * 1000);
        
        // Also check on bot startup
        this.checkBirthdays();
    }
}

module.exports = BirthdayHandler; 