const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

function isAdminOrAuthorizedUser(interaction) {
    const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
    
    console.log('Permission Check Debug:', {
        adminUserId: ADMIN_USER_ID,
        interactionUserId: interaction.user.id,
        isAdminPermission: interaction.member.permissions.has('Administrator')
    });

    // Check if user is an administrator
    const isAdmin = interaction.member.permissions.has('Administrator');
    
    // Check if user is the specific authorized user
    const isAuthorizedUser = interaction.user.id === ADMIN_USER_ID;

    return isAdmin || isAuthorizedUser;
}

module.exports = {
    isRaidLeader,
    isRaider,
    isAdminOrAuthorizedUser
};
