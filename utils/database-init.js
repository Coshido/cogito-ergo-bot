const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Timeout for database initialization (5 seconds)
const DATABASE_INIT_TIMEOUT = 5000;

// Predefined default content for various files
const DEFAULT_CONTENTS = {
    'config.json': { version: '1.0.0' },
    'reservations.json': { reservations: [] },
    'birthday-data.json': { birthdays: [] },
    'league-data.json': { leagues: [] },
    'league-config.json': { config: {} },
    'raid-loot.json': getHardcodedRaidLootData()
};

const EXACT_COPY_FILES = [
    'raid-loot.json'
];

function getHardcodedRaidLootData() {
    return {
        "raid": "Palazzo dei Nerub'ar",
        "bosses": [
            {
                "id": 2607,
                "name": "Ulgrax Divoratore",
                "loot": [
                    {
                        "id": "219915",
                        "name": "Chelicera Behemoth",
                        "type": "Monile Varie",
                        "ilvl": 571
                    }
                ]
            },
            {
                "id": 2611,
                "name": "Orrore Vincolasangue",
                "loot": [
                    {
                        "id": "219917",
                        "name": "Coagulo Strisciante",
                        "type": "Monile Varie",
                        "ilvl": 571
                    }
                ]
            }
        ]
    };
}

async function ensureDatabaseDirectory(databasePath) {
    console.log('Attempting to create database directory:', databasePath);
    try {
        // Ensure the directory exists with full permissions
        await fs.mkdir(databasePath, { recursive: true, mode: 0o777 });
        console.log('Database directory created or already exists');
    } catch (error) {
        console.error('CRITICAL: Failed to create database directory:', error);
        throw error;
    }
}

async function initializeDatabaseFiles(databasePath) {
    console.log('Initializing database files in:', databasePath);

    for (const filename of Object.keys(DEFAULT_CONTENTS)) {
        const filePath = path.join(databasePath, filename);
        
        try {
            // Check if file exists
            try {
                await fs.access(filePath);
                console.log(`File ${filename} already exists`);
            } catch {
                // File doesn't exist, create it with default content
                const defaultContent = DEFAULT_CONTENTS[filename];
                await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
                console.log(`Created default ${filename}`);
            }
        } catch (error) {
            console.error(`CRITICAL: Failed to initialize ${filename}:`, error);
            throw error;
        }
    }
}

async function initializeDatabase(customPath) {
    console.log('Starting database initialization');
    console.log('Custom database path received:', customPath);
    
    // Set up a timeout to prevent hanging
    const initializationTimeout = new Promise((_, reject) => 
        setTimeout(() => {
            const timeoutError = new Error('Database initialization timed out');
            timeoutError.name = 'DatabaseInitializationTimeoutError';
            reject(timeoutError);
        }, DATABASE_INIT_TIMEOUT)
    );

    try {
        // Possible database paths in order of preference
        const possiblePaths = [
            customPath,
            process.env.DATABASE_PATH,
            '/app/database',
            '/database',
            path.join(__dirname, '../database')
        ].filter(Boolean);

        let databasePath;
        for (const testPath of possiblePaths) {
            try {
                await fs.access(testPath);
                databasePath = testPath;
                console.log('Using database path:', databasePath);
                break;
            } catch {
                console.log(`Path not accessible: ${testPath}`);
            }
        }

        if (!databasePath) {
            throw new Error('No valid database path found');
        }

        // Run initialization steps
        await Promise.race([
            (async () => {
                await ensureDatabaseDirectory(databasePath);
                
                // Force write hardcoded raid loot data
                const raidLootPath = path.join(databasePath, 'raid-loot.json');
                try {
                    const hardcodedRaidLootData = getHardcodedRaidLootData();
                    
                    // Log existing file contents before overwriting
                    try {
                        const existingContents = fsSync.readFileSync(raidLootPath, 'utf8');
                        console.log('Existing raid-loot.json contents:', existingContents);
                    } catch (readError) {
                        console.log('No existing raid-loot.json file found');
                    }

                    // Write hardcoded data
                    fsSync.writeFileSync(raidLootPath, JSON.stringify(hardcodedRaidLootData, null, 2));
                    console.log('Forcibly wrote hardcoded raid loot data');
                    
                    // Verify written contents
                    const writtenContents = fsSync.readFileSync(raidLootPath, 'utf8');
                    console.log('Newly written raid-loot.json contents:', writtenContents);
                } catch (error) {
                    console.error('Error writing hardcoded raid loot data:', error);
                }
                
                await initializeDatabaseFiles(databasePath);

                return databasePath;
            })(),
            initializationTimeout
        ]);

        console.log('Database initialization completed successfully');
        return databasePath;
    } catch (error) {
        console.error('CRITICAL: Database initialization failed:', error);
        
        // Log detailed error information
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Rethrow to ensure the process knows initialization failed
        throw error;
    }
}

module.exports = { initializeDatabase };
