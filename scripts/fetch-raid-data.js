const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config'); 

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Track filtered and missing items globally
const missingItems = [];
const filteredItems = [];

async function makeRequest(url, params, accessToken, retries = 3, delayMs = 1000) {
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${accessToken}`,
        'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Referer': 'https://develop.battle.net/',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempt ${i + 1} of ${retries} for ${url}...`);
            const response = await axios.get(url, { 
                params,
                headers
            });
            return response;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Resource not found:', url);
                // Extract item ID from URL if it's an item request
                const itemIdMatch = url.match(/\/item\/(\d+)$/);
                if (itemIdMatch) {
                    missingItems.push({
                        id: itemIdMatch[1],
                        url: url,
                        timestamp: new Date().toISOString()
                    });
                }
                return null;
            }
            if (i === retries - 1) throw error;
            console.log(`Attempt failed, retrying in ${delayMs}ms...`);
            await delay(delayMs);
        }
    }
}

// Helper function to check if an item is equipment and determine its type
function isEquipment(item) {
    // Check for emblems and tokens by name
    const tokenKeywords = [
        // English
        'emblem', 'token', 'mark', 'proof', 'symbol', 'fragment', 'sigil',
        // Italian
        'emblema', 'distintivo', 'icona', 'gettone', 'insegna', 'marchio', 
        'prova', 'simbolo', 'frammento',
        // German
        'abzeichen', 'marke', 'token', 'beweis', 'symbol', 'fragment',
        // French
        'emblème', 'jeton', 'marque', 'preuve', 'symbole', 'fragment',
        // Spanish
        'emblema', 'ficha', 'marca', 'prueba', 'símbolo', 'fragmento'
    ];
    
    if (item.name) {
        const lowerName = item.name.toLowerCase();
        // Check for token-like items
        if (tokenKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
            item.itemType = 'token';
            return true;
        }
    }

    // For retail API
    if (item.inventory_type) {
        const equipmentSlots = [
            'HEAD', 'NECK', 'SHOULDER', 'SHIRT', 'CHEST', 'WAIST', 'LEGS', 'FEET',
            'WRIST', 'HANDS', 'FINGER', 'TRINKET', 'WEAPON', 'SHIELD', 'RANGED', 'BACK',
            'TWO_HAND', 'BAG', 'TABARD', 'ROBE', 'MAIN_HAND', 'OFF_HAND', 'HOLDABLE',
            'AMMO', 'THROWN', 'RANGEDRIGHT', 'QUIVER', 'RELIC', 'CLOAK',
            // Add specific types found in filtered items
            'TWOHWEAPON', 'RANGEDRIGHT', 'HAND'
        ];

        // Check both the type and type.type to handle different API response formats
        const itemType = typeof item.inventory_type === 'string' 
            ? item.inventory_type 
            : item.inventory_type.type;

        if (equipmentSlots.includes(itemType)) {
            item.itemType = 'equipment';
            return true;
        }
    }

    // For classic API
    if (item.itemClass) {
        const equipmentClasses = [
            'Armor', 'Weapon', 'Miscellaneous'  // Include Miscellaneous for certain special items
        ];
        if (equipmentClasses.includes(item.itemClass)) {
            // For Miscellaneous class, only include if it's equippable
            if (item.itemClass === 'Miscellaneous' && !item.inventory_type) {
                return false;
            }
            item.itemType = 'equipment';
            return true;
        }
    }

    // Log filtered items for analysis
    if (item.name) {
        filteredItems.push({
            id: item.id,
            name: item.name,
            type: item.inventory_type?.type || item.itemClass,
            timestamp: new Date().toISOString()
        });
    }

    return false;
}

async function processItemResponse(item, isClassic, accessToken) {
    try {
        // Skip non-equipment items
        if (!isEquipment(item)) {
            return null;
        }

        if (isClassic) {
            return {
                id: item.id.toString(),
                name: item.name,
                type: `${item.itemClass} ${item.itemSubClass}`,
                ilvl: item.itemLevel,
                icon: `https://wow.zamimg.com/images/wow/icons/large/${item.icon}.jpg`,
                wowhead_url: `https://www.wowhead.com/item=${item.id}`,
                image_url: `https://wow.zamimg.com/images/wow/icons/large/${item.icon}.jpg`
            };
        }

        // Try to get media for retail items
        const mediaResponse = await makeRequest(
            `https://${config.region}.api.blizzard.com/data/wow/media/item/${item.id}`,
            {
                namespace: `static-${config.region}`,
                locale: config.locale
            },
            accessToken
        );

        const iconUrl = mediaResponse?.data?.assets?.[0]?.value;

        return {
            id: item.id.toString(),
            name: item.name,
            type: `${item.inventory_type.name} ${item.item_subclass.name}`,
            ilvl: item.level,
            icon: iconUrl,
            wowhead_url: `https://www.wowhead.com/item=${item.id}`,
            image_url: iconUrl
        };
    } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        return null;
    }
}

async function fetchItemData(itemId, accessToken) {
    try {
        // Try the retail item API first
        const itemResponse = await makeRequest(
            `https://${config.region}.api.blizzard.com/data/wow/item/${itemId}`,
            {
                namespace: `static-${config.region}`,
                locale: config.locale
            },
            accessToken
        );

        if (!itemResponse) {
            // If retail API fails, try the classic gamedata API
            console.log(`Trying classic gamedata API for item ${itemId}...`);
            const classicResponse = await makeRequest(
                `https://${config.region}.api.blizzard.com/wow/item/${itemId}`,
                {
                    locale: config.locale
                },
                accessToken
            );

            if (!classicResponse) {
                console.log(`Could not find item ${itemId} in any API`);
                return null;
            }

            return processItemResponse(classicResponse.data, true, accessToken);
        }

        return processItemResponse(itemResponse.data, false, accessToken);
    } catch (error) {
        console.error(`Error fetching item ${itemId}:`, error.message);
        return null;
    }
}

async function getAccessToken() {
    try {
        console.log('Getting access token...', config.clientId, config.clientSecret);
        const response = await axios.post('https://oauth.battle.net/token', 
            'grant_type=client_credentials', 
            {
                auth: {
                    username: config.clientId,
                    password: config.clientSecret
                }
            }
        );
        console.log('Successfully obtained access token');
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:');
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else {
            console.error(error.message);
        }
        throw error;
    }
}

async function fetchRaidData(accessToken) {
    try {
        // Use the journal-instance API to get raid data
        console.log('Fetching raid data...');
        const raidResponse = await makeRequest(
            `https://${config.region}.api.blizzard.com/data/wow/journal-instance/1296`, // Liberation of Undermine instance ID
            {
                namespace: `static-${config.region}`,
                locale: config.locale
            },
            accessToken
        );

        if (!raidResponse || !raidResponse.data) {
            throw new Error('Could not find Liberation of Undermine raid data');
        }

        console.log('Found raid:', raidResponse.data);

        const raid = {
            raid: raidResponse.data.name,
            bosses: [],
            difficulties: [
                { name: "Looking For Raid", ilvl: 584 },
                { name: "Normal", ilvl: 597 },
                { name: "Heroic", ilvl: 610 },
                { name: "Mythic", ilvl: 623 }
            ]
        };

        // Process each encounter
        for (const encounter of raidResponse.data.encounters) {
            console.log(`Fetching data for boss: ${encounter.name}`);
            
            const encounterDetails = await makeRequest(
                `https://${config.region}.api.blizzard.com/data/wow/journal-encounter/${encounter.id}`,
                {
                    namespace: `static-${config.region}`,
                    locale: config.locale
                },
                accessToken
            );

            if (!encounterDetails) continue;

            console.log('Encounter details:', encounterDetails.data);

            const bossData = {
                id: encounter.id,
                name: encounterDetails.data.name,
                loot: []
            };

            // Get loot table for this encounter
            if (encounterDetails.data.items) {
                for (const item of encounterDetails.data.items) {
                    console.log(`Fetching item data: ${item.item.id}`);
                    const lootItem = await fetchItemData(item.item.id, accessToken);
                    if (lootItem) {
                        bossData.loot.push(lootItem);
                    }
                }
            }

            raid.bosses.push(bossData);
        }

        // Add missing and filtered items report to the output
        raid.missingItems = missingItems;
        raid.filteredItems = filteredItems;
        
        // Save the data to raid-loot.json
        await fs.writeFile(
            path.join(__dirname, '..', 'database', 'raid-loot.json'),
            JSON.stringify(raid, null, 2),
            'utf8'
        );

        console.log('Raid data has been successfully fetched and saved!');
        console.log('\nMissing Items Report:');
        console.log(JSON.stringify(missingItems, null, 2));
        console.log('\nFiltered Items Report:');
        console.log(JSON.stringify(filteredItems, null, 2));
    } catch (error) {
        console.error('Error fetching raid data:');
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            console.error('Request URL:', error.response.config.url);
            if (error.response.data && error.response.data.detail) {
                console.error('Error detail:', error.response.data.detail);
            }
        } else {
            console.error(error.message);
        }
        throw error;
    }
}

async function main() {
    try {
        const accessToken = await getAccessToken();
        await fetchRaidData(accessToken);
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

main();
