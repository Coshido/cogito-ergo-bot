const fs = require('fs');
const path = require('path');

function loadConfig() {
    const configPath = path.join(__dirname, '..', 'database', 'config.json');
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
        console.error('Error reading config file:', error);
        return {};
    }
}

function isRaidLeader(member) {
    const config = loadConfig();
    return member.roles.cache.has(config.raidLeaderRoleId);
}

function isRaider(member) {
    const config = loadConfig();
    return member.roles.cache.has(config.raiderRoleId);
}

module.exports = {
    isRaidLeader,
    isRaider
};
