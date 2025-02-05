const fs = require('fs');
const path = require('path');

// Clean all reservations
function cleanReservations() {
    const reservationsPath = path.join(__dirname, '../database/reservations.json');
    
    // Create empty reservations structure
    const emptyReservations = {
        weekly_reservations: {}
    };

    // Save empty reservations
    fs.writeFileSync(reservationsPath, JSON.stringify(emptyReservations, null, 2));
    console.log('Reservations database cleaned!');
}

// Run the clean
cleanReservations(); 