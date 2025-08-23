const fs = require('fs').promises;
const path = require('path');
const ImageComposer = require('./image-composer');

// Predefined default content for various files
const DEFAULT_CONTENTS = {
    'config.json': { version: '1.0.0' },
    'reservations.json': { reservations: [] },
    'birthday-data.json': { birthdays: [] }
};


async function initializeDatabase(customPath) {
    // Set a default database path if no path is provided
    const defaultDatabasePath = path.resolve(__dirname, '../database');
    const databasePath = customPath || process.env.DATABASE_PATH || defaultDatabasePath;

    console.log('databasePath: ', databasePath);

    console.log('Initializing database with path:', databasePath);

    // Validate that databasePath is a string
    if (typeof databasePath !== 'string') {
        console.error('Invalid database path:', databasePath);
        throw new Error(`Database path must be a string. Received: ${typeof databasePath}`);
    }

    try {
        // Ensure the database directory exists
        await fs.mkdir(databasePath, { recursive: true });

        console.log('Starting comprehensive database initialization...');
        
        // Ensure all required files exist
        await initializeDatabaseFiles(databasePath);
        
        console.log(`Database successfully initialized at: ${databasePath}`);
        
        return databasePath;
    } catch (error) {
        console.error('Critical error during database initialization:', error);
        throw error;
    }
}

async function initializeDatabaseFiles(databasePath) {
    console.time('Database Initialization');
    console.log(`Starting comprehensive database file initialization in ${databasePath}`);

    // Specific path for raid loot file
    const raidLootPath = path.join(databasePath, 'raid-loot.json');
    
    try {
        // Check if file exists and has content
        let existingData;
        try {
            existingData = await fs.readFile(raidLootPath, 'utf8').trim();
        } catch (readError) {
            // File doesn't exist; log and proceed. We no longer seed hardcoded data.
            console.warn('raid-loot.json not found. Skipping loot image pre-generation. You can generate it via scripts/fetch-raid-data.js');
            existingData = '';
        }

        if (existingData) {
            // Optional: Parse and log existing data for verification
            try {
                const existingParsedData = JSON.parse(existingData);
                console.log('Existing raid loot data detected:', existingParsedData.bosses ? `${existingParsedData.bosses.length} bosses` : 'No bosses');
            } catch (parseError) {
                console.error('Error parsing existing raid loot data:', parseError);
            }
        }
    } catch (error) {
        console.error('Error checking raid loot data:', error);
        throw error;
    }

    // Continue with other database file initializations if needed
    for (const filename of Object.keys(DEFAULT_CONTENTS)) {
        if (filename === 'raid-loot.json') {
            continue;
        }
        
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
            console.error(`Critical error initializing ${filename}:`, error);
            throw error;
        }
    }

    // Generate comprehensive boss loot images after database is initialized
    try {
        let bosses = [];
        try {
            const raw = await fs.readFile(raidLootPath, 'utf8');
            const raidLootData = JSON.parse(raw);
            bosses = Array.isArray(raidLootData.bosses) ? raidLootData.bosses : [];
        } catch (e) {
            console.warn('Skipping loot image pre-generation: raid-loot.json missing or invalid. Details:', e.message);
        }

        if (bosses.length === 0) {
            console.log('No bosses found in raid-loot.json. Skipping loot image pre-generation.');
        } else {
            console.log(`Preparing to generate comprehensive loot images for ${bosses.length} bosses...`);
            console.time('Boss Loot Image Generation');
            
            const lootImageGenerationResults = await ImageComposer.generateComprehensiveBossLootImages(bosses);

            console.timeEnd('Boss Loot Image Generation');
            console.log('Boss Comprehensive Loot Image Generation Summary:');
            console.log('Generated:', lootImageGenerationResults.filter(r => r.status === 'generated').length);
            console.log('Skipped:', lootImageGenerationResults.filter(r => r.status === 'skipped').length);
            console.log('Failed:', lootImageGenerationResults.filter(r => r.status === 'failed').length);

            const failedBosses = lootImageGenerationResults.filter(r => r.status === 'failed');
            if (failedBosses.length > 0) {
                console.warn('Failed to generate comprehensive loot images for these bosses:', 
                    failedBosses.map(boss => boss.boss).join(', ')
                );
            }
        }

        console.timeEnd('Database Initialization');
    } catch (error) {
        console.error('Error during comprehensive boss loot image generation:', error);
    }
}


module.exports = { initializeDatabase };
