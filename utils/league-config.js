const fs = require('fs').promises;
const path = require('path');

class LeagueConfig {
    static LEAGUE_CONFIG_PATH = path.join(__dirname, '../database/league-config.json');

    // Load league configuration
    static async loadConfig() {
        try {
            const data = await fs.readFile(this.LEAGUE_CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, return default configuration
            if (error.code === 'ENOENT') {
                return {
                    managerRoleId: null,
                    participantRoleId: null
                };
            }
            throw error;
        }
    }

    // Save league configuration
    static async saveConfig(config) {
        await fs.writeFile(
            this.LEAGUE_CONFIG_PATH, 
            JSON.stringify(config, null, 2)
        );
    }

    // Set league manager role
    static async setManagerRole(roleId) {
        const config = await this.loadConfig();
        config.managerRoleId = roleId;
        await this.saveConfig(config);
        return config;
    }

    // Set league participant role
    static async setParticipantRole(roleId) {
        const config = await this.loadConfig();
        config.participantRoleId = roleId;
        await this.saveConfig(config);
        return config;
    }

    // Check if a user is a league manager
    static async isLeagueManager(member) {
        const config = await this.loadConfig();
        return config.managerRoleId 
            ? member.roles.cache.has(config.managerRoleId)
            : false;
    }

    // Check if a user is a league participant
    static async isLeagueParticipant(member) {
        const config = await this.loadConfig();
        return config.participantRoleId 
            ? member.roles.cache.has(config.participantRoleId)
            : false;
    }
}

module.exports = LeagueConfig;
