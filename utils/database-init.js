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
    console.log('Attempting to create database directory:', databasePath);
    try {
        await fs.mkdir(databasePath, { recursive: true });
        console.log('Database directory created or already exists');
    } catch (error) {
        console.error('Error creating database directory:', error);
        throw error;
    }
}

async function initializeDatabaseFiles(databasePath) {
    console.log('Initializing database files in:', databasePath);
    
    for (const [filename, defaultContent] of Object.entries(DEFAULT_CONFIGS)) {
        const filePath = path.join(databasePath, filename);
        
        try {
            // Check if file exists
            await fs.access(filePath);
            console.log(`File ${filename} already exists`);
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
    console.log('Custom database path received:', customPath);
    
    // Fallback paths in order of preference
    const possiblePaths = [
        customPath,
        process.env.DATABASE_PATH,
        '/app/database',
        '/database',
        path.join(__dirname, '../database')
    ];

    // Find the first valid path
    let databasePath;
    for (const testPath of possiblePaths) {
        if (testPath) {
            try {
                await fs.access(testPath);
                databasePath = testPath;
                console.log('Using database path:', databasePath);
                break;
            } catch {
                console.log(`Path not accessible: ${testPath}`);
            }
        }
    }

    if (!databasePath) {
        throw new Error('No valid database path found');
    }

    await ensureDatabaseDirectory(databasePath);
    await initializeDatabaseFiles(databasePath);

    return databasePath;
}

module.exports = {
    initializeDatabase
};
