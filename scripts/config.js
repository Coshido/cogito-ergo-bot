require('dotenv').config();

module.exports = {
    clientId: process.env.BLITZ_CLIENT_ID,
    clientSecret: process.env.BLITZ_CLIENT_SECRET,
    region: process.env.BLITZ_REGION || 'eu',
    locale: process.env.BLITZ_LOCALE || 'it_IT'
};
