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
            console.log(`Attempting to copy ${filename}`);
            console.log('Source file path:', sourceFile);
            console.log('Destination file path:', destFile);
            
            if (!fsSync.existsSync(sourceFile)) {
                console.error(`Source file NOT FOUND: ${sourceFile}`);
                continue;
            }
            
            const sourceFileContents = fsSync.readFileSync(sourceFile, 'utf8');
            console.log('Source file contents length:', sourceFileContents.length);
            
            if (sourceFileContents.trim().length === 0) {
                console.error(`Source file is empty: ${sourceFile}`);
                continue;
            }
            
            const parsedContent = JSON.parse(sourceFileContents);
            console.log('Parsed content:', JSON.stringify(parsedContent, null, 2));
            
            fsSync.writeFileSync(destFile, JSON.stringify(parsedContent, null, 2));
            
            const destFileContents = fsSync.readFileSync(destFile, 'utf8');
            console.log('Destination file contents length:', destFileContents.length);
            
            console.log(`Successfully copied and validated ${filename}`);
        } catch (error) {
            console.error(`CRITICAL ERROR copying ${filename}:`, error);
            throw error;
        }
    }
}

async function initializeDatabaseFiles(databasePath) {
    console.log('Initializing database files in:', databasePath);
    
    for (const [filename, defaultContent] of Object.entries(DEFAULT_CONFIGS)) {
        const filePath = path.join(databasePath, filename);
        
        try {
            await fs.access(filePath);
            console.log(`File ${filename} already exists`);
        } catch (error) {
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
    
    const possiblePaths = [
        customPath,
        process.env.DATABASE_PATH,
        '/app/database',
        '/database',
        path.join(__dirname, '../database')
    ];

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

    const sourcePath = path.join(__dirname, '../database');

    await ensureDatabaseDirectory(databasePath);
    
    copyExactFiles(sourcePath, databasePath);
    
    await initializeDatabaseFiles(databasePath);

    return databasePath;
}

module.exports = {
    initializeDatabase
};
