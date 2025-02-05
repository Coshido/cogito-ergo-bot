const { Buffer } = require('buffer');
const zlib = require('zlib');

// Basic implementation of WoW's LibDeflate encoding
class LibDeflate {
    static CompressDeflate(str) {
        return zlib.deflateRawSync(Buffer.from(str), {
            level: 9,
            windowBits: 15
        });
    }

    static EncodeForWoW(data) {
        return data.toString('base64')
            .replace(/\+/g, 'v')
            .replace(/\//g, 'f')
            .replace(/=/g, 'z');
    }

    static TableToString(obj) {
        return JSON.stringify(obj);  // For now, use JSON instead of Lua format
    }
}

module.exports = LibDeflate; 