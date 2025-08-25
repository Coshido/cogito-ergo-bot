const axios = require('axios');
const config = require('./config');

async function getAccessToken() {
  const resp = await axios.post('https://oauth.battle.net/token', 'grant_type=client_credentials', {
    auth: { username: config.clientId, password: config.clientSecret }
  });
  return resp.data.access_token;
}

async function main() {
  try {
    const itemId = process.argv[2] || '237597';
    const token = await getAccessToken();

    const itemResp = await axios.get(`https://${config.region}.api.blizzard.com/data/wow/item/${itemId}` , {
      params: { namespace: `static-${config.region}`, locale: config.locale },
      headers: { authorization: `Bearer ${token}` }
    });

    console.log('=== Item Payload ===');
    console.log(JSON.stringify(itemResp.data, null, 2));

    // Also show media (icon) for completeness
    try {
      const mediaResp = await axios.get(`https://${config.region}.api.blizzard.com/data/wow/media/item/${itemId}` , {
        params: { namespace: `static-${config.region}`, locale: config.locale },
        headers: { authorization: `Bearer ${token}` }
      });
      console.log('\n=== Media Payload ===');
      console.log(JSON.stringify(mediaResp.data, null, 2));
    } catch (e) {
      console.error('\n(Media fetch failed)');
      if (e.response) console.error(e.response.status, e.response.data);
      else console.error(e.message);
    }
  } catch (e) {
    console.error('Failed:', e.response ? e.response.status : e.message);
    if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    process.exit(1);
  }
}

main();
