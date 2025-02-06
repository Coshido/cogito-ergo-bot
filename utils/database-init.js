const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const DEFAULT_CONFIGS = {
    'config.json': {
        raidLeaderRoleId: null,
        raiderRoleId: null
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

const EXACT_COPY_FILES = [
    'raid-loot.json'
];

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

async function copyExactFiles(sourcePath, destPath) {
    console.log('Copying exact files from:', sourcePath, 'to:', destPath);
    
    for (const filename of EXACT_COPY_FILES) {
        const sourceFile = path.join(sourcePath, filename);
        const destFile = path.join(destPath, filename);
        
        try {
            // Check if source file exists
            if (!fsSync.existsSync(sourceFile)) {
                console.log(`Source file not found: ${sourceFile}`);
                continue;
            }
            
            // Copy file exactly
            fsSync.copyFileSync(sourceFile, destFile);
            console.log(`Copied ${filename} exactly`);
        } catch (error) {
            console.error(`Error copying ${filename}:`, error);
        }
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

    // Source path for exact file copies
    const sourcePath = path.join(__dirname, '../database');

    await ensureDatabaseDirectory(databasePath);
    
    // Copy exact files first
    copyExactFiles(sourcePath, databasePath);
    
    // Then initialize other files
    await initializeDatabaseFiles(databasePath);

    return databasePath;
}

module.exports = {
    initializeDatabase
};
