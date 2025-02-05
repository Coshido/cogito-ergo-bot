const fs = require('fs');
const path = require('path');
const { getCurrentWeekMonday } = require('../utils/reservation-utils');

// Read raid loot data to get bosses and items
const raidLootPath = path.join(__dirname, '..', 'database', 'raid-loot.json');
const reservationsPath = path.join(__dirname, '..', 'database', 'reservations.json');
const raidData = JSON.parse(fs.readFileSync(raidLootPath, 'utf8'));

// Generate mock character names
const characterNames = [
    'Eldrin', 'Zara', 'Thorin', 'Lyra', 'Kael', 
    'Aria', 'Rowan', 'Nyx', 'Soren', 'Ember',
    'Rune', 'Vex', 'Kai', 'Luna', 'Dax',
    'Iris', 'Ash', 'Nova', 'Zen', 'Raven'
];

// Generate mock Discord usernames
const usernames = [
    'DragonSlayer', 'ShadowWalker', 'MoonLight', 'StarBlade', 'FireHeart',
    'WindRider', 'StormCaller', 'NightWhisper', 'EarthShaker', 'IronFist',
    'SilverArrow', 'RuneMaster', 'SoulBinder', 'DarkRider', 'LightBringer',
    'MysticWarden', 'BloodMoon', 'CrimsonTide', 'SilentStrike', 'EchoReaper'
];

// Function to get random item from an array
function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Generate reservations
function generateReservations() {
    const currentWeek = getCurrentWeekMonday();
    const weeklyReservations = {};

    // Shuffle and slice character names to get 20 unique characters
    const selectedCharacters = characterNames
        .sort(() => 0.5 - Math.random())
        .slice(0, 20);

    selectedCharacters.forEach((characterName, index) => {
        // Select a random boss
        const boss = getRandomItem(raidData.bosses);
        
        // Select a random item from the boss's loot
        const item = getRandomItem(boss.loot);

        // Create a unique user ID (for demonstration)
        const userId = `user_${index + 1}`;

        weeklyReservations[userId] = {
            character_name: characterName,
            discord_username: usernames[index],
            items: [{
                boss: boss.name,
                name: item.name
            }]
        };
    });

    // Read existing reservations or create new
    let reservations = { weekly_reservations: {} };
    try {
        reservations = JSON.parse(fs.readFileSync(reservationsPath, 'utf8'));
    } catch (error) {
        console.log('Creating new reservations file');
    }

    // Add or replace current week's reservations
    reservations.weekly_reservations[currentWeek] = weeklyReservations;

    // Write back to file
    fs.writeFileSync(reservationsPath, JSON.stringify(reservations, null, 2));

    console.log(`Generated ${Object.keys(weeklyReservations).length} mock reservations for ${currentWeek}`);
}

// Run the script
generateReservations();
