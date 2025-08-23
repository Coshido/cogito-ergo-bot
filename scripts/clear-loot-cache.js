#!/usr/bin/env node

/**
 * Clear the cached boss loot images directory.
 * Directory: assets/boss-loot-cache/
 *
 * Usage:
 *   node scripts/clear-loot-cache.js
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

async function clearCache() {
  const cacheDir = path.resolve(__dirname, '../assets/boss-loot-cache');

  try {
    // Remove the existing cache directory if it exists
    if (fs.existsSync(cacheDir)) {
      console.log(`Removing cache directory: ${cacheDir}`);
      await fsp.rm(cacheDir, { recursive: true, force: true });
    } else {
      console.log(`Cache directory not found, nothing to remove: ${cacheDir}`);
    }

    // Recreate the cache directory
    await fsp.mkdir(cacheDir, { recursive: true });
    console.log('Cache directory recreated.');

    console.log('Boss loot image cache cleared successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to clear boss loot image cache:', err);
    process.exit(1);
  }
}

clearCache();
