const fs = require('fs').promises;
const path = require('path');

const DEFAULT_CONFIGS = {
    'config.json': {
        raidLeaderRoleId: null,
        raiderRoleId: null
    },
    'raid-loot.json': {
        raid: "Default Raid",
        bosses: []
    },
    'reservations.json': {
        weekly_reservations: {}
    },
    'birthday-data.json': {
        birthdays: {},
        settings: {}
    },
    'league-data.json': {
        participants: []
    },
    'league-config.json': {
        managerRoleId: null,
        participantRoleId: null
    }
};

async function ensureDatabaseDirectory(databasePath) {
    try {
        await fs.mkdir(databasePath, { recursive: true });
    } catch (error) {
        console.error('Error creating database directory:', error);
    }
}

async function initializeDatabaseFiles(databasePath) {
    for (const [filename, defaultContent] of Object.entries(DEFAULT_CONFIGS)) {
        const filePath = path.join(databasePath, filename);
        
        try {
            // Check if file exists
            await fs.access(filePath);
        } catch (error) {
            // File doesn't exist, create it with default content
            try {
                await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
                console.log(`Created default ${filename}`);
            } catch (writeError) {
                console.error(`Error creating ${filename}:`, writeError);
            }
        }
    }
}

async function initializeDatabase(customPath) {
    const databasePath = customPath || path.join(__dirname, '../database');
    
    await ensureDatabaseDirectory(databasePath);
    await initializeDatabaseFiles(databasePath);
}

module.exports = {
    initializeDatabase
};
