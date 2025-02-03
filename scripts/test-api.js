const axios = require('axios');
const config = require('./config');

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
            console.log(`Attempt ${i + 1} of ${retries}...`);
            const response = await axios.get(url, { 
                params,
                headers
            });
            return response;
        } catch (error) {
            if (i === retries - 1) throw error; // Last attempt, throw the error
            console.log(`Attempt failed, retrying in ${delayMs}ms...`);
            await delay(delayMs);
        }
    }
}

async function testAPI() {
    try {
        console.log('Getting access token...');
        const tokenResponse = await axios.post('https://oauth.battle.net/token', 
            'grant_type=client_credentials', 
            {
                auth: {
                    username: config.clientId,
                    password: config.clientSecret
                }
            }
        );
        
        const accessToken = tokenResponse.data.access_token;
        console.log('Successfully got access token');

        // Use the exact working endpoint
        console.log('Testing API with achievement index endpoint...');
        const url = `https://${config.region}.api.blizzard.com/data/wow/achievement/index`;
        const params = {
            namespace: `static-${config.region}`,
            locale: config.locale
        };

        const response = await makeRequest(url, params, accessToken);
        console.log('API test successful! Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error testing API:');
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            console.error('Request URL:', error.response.config.url);
            console.error('Request headers:', JSON.stringify(error.response.config.headers, null, 2));
            console.error('Request params:', JSON.stringify(error.response.config.params, null, 2));
            if (error.response.data && error.response.data.detail) {
                console.error('Error detail:', error.response.data.detail);
            }
        } else {
            console.error(error.message);
        }
    }
}

testAPI();
