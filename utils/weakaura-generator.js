const zlib = require('zlib');

class WeakAuraGenerator {
    // Custom base64 encoding specific to WeakAuras
    static encodeForWoWAddonChannel(data) {
        // Replace characters that might cause transmission issues
        return data
            .replace(/\\/g, '\\\\')   // Escape backslashes first
            .replace(/\n/g, '\\n')    // Escape newlines
            .replace(/\r/g, '\\r')    // Escape carriage returns
            .replace(/\0/g, '')       // Remove null bytes
            .replace(/[^\x20-\x7E]/g, function(char) {
                return '\\x' + char.charCodeAt(0).toString(16).padStart(2, '0');
            });
    }

    // Decode WoW addon channel encoded data
    static decodeForWoWAddonChannel(encodedData) {
        return encodedData
            .replace(/\\x([0-9a-fA-F]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\\\/g, '\\');
    }

    // Generate WeakAura string with LibDeflate-like approach
    static generateLootReservationWA(reservationsData) {
        // Validate input
        if (!reservationsData || !reservationsData.weekly_reservations) {
            throw new Error('Invalid or empty reservations data');
        }

        // Generate Lua script for WeakAura
        const luaScript = this.generateLuaScript(reservationsData);

        try {
            // Compress using raw DEFLATE (similar to LibDeflate's CompressDeflate)
            const compressedScript = zlib.deflateRawSync(Buffer.from(luaScript, 'utf8'));

            // Encode for WoW addon channel transmission
            const encodedScript = this.encodeForWoWAddonChannel(compressedScript.toString('base64'));

            // Return WeakAura import string with !WA:2! prefix
            const weakAuraString = `!WA:2!${encodedScript}`;

            // Validation (optional but recommended)
            try {
                const decodedBase64 = Buffer.from(
                    this.decodeForWoWAddonChannel(encodedScript), 
                    'base64'
                );
                const decompressedScript = zlib.inflateRawSync(decodedBase64).toString('utf8');
                
                if (decompressedScript.trim() !== luaScript.trim()) {
                    console.warn('WeakAura script validation failed');
                }
            } catch (validationError) {
                console.error('WeakAura validation error:', validationError);
            }

            return weakAuraString;
        } catch (error) {
            console.error('WeakAura generation failed:', error);
            throw error;
        }
    }

    // Existing method to generate Lua script remains the same
    static generateLuaScript(reservationsData) {
        const reservations = [];

        Object.values(reservationsData.weekly_reservations).forEach(weekReservations => {
            Object.values(weekReservations).forEach(userReservation => {
                userReservation.items.forEach(item => {
                    reservations.push({
                        character: this.escapeLuaString(userReservation.character_name),
                        item: this.escapeLuaString(item.name),
                        boss: this.escapeLuaString(item.boss)
                    });
                });
            });
        });

        // Lua script template with dynamic reservation list
        return `
local reservations = {
    ${reservations.map(r => 
        `{character = "${r.character}", item = "${r.item}", boss = "${r.boss}"}`
    ).join(',\n    ')}
}

local function GetReservationText()
    local output = "|cffffd100Loot Reservations:|r\\n"
    for _, reserve in ipairs(reservations) do
        output = output .. string.format("|cffffffff%s:|r %s (%s)\\n", reserve.character, reserve.item, reserve.boss)
    end
    return output
end

local aura_env = {
    id = "CogitoDKPReservations",
    desc = "Loot Reservations Display",
    internalVersion = 60,
    load = {
        always = true
    },
    trigger = {
        type = "custom",
        event = "STATUS",
        custom = "function() return true end",
        custom_type = "status"
    },
    text = {
        text = GetReservationText
    }
}

return aura_env`.trim();
    }

    // Existing method to escape Lua strings
    static escapeLuaString(str) {
        return str
            .replace(/\\/g, '\\\\')   // Escape backslashes first
            .replace(/"/g, '\\"')     // Escape double quotes
            .replace(/\n/g, '\\n')    // Escape newlines
            .replace(/\r/g, '\\r')    // Escape carriage returns
            .replace(/\t/g, '\\t');   // Escape tabs
    }

    // Detailed logging method
    static logError(context, error) {
        console.error(`[WeakAura Generator Error - ${context}]`);
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
    }

    // Detailed error logging method
    static logDetailedError(context, error, additionalInfo = {}) {
        console.error(`[WeakAura Decoding Error - ${context}]`);
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        
        // Log additional context
        Object.entries(additionalInfo).forEach(([key, value]) => {
            console.error(`${key}:`, value);
        });
    }

    static getReservationDetails(reservationsData) {
        if (!reservationsData || !reservationsData.weekly_reservations) {
            return { 
                displayText: "No Loot Reservations",
                totalReservations: 0
            };
        }

        let totalReservations = 0;
        const reservationInfo = [];

        Object.values(reservationsData.weekly_reservations).forEach(weekReservations => {
            Object.values(weekReservations).forEach(userReservation => {
                userReservation.items.forEach(item => {
                    totalReservations++;
                    reservationInfo.push(`|cffffffff${userReservation.character_name}:|r ${item.name} (${item.boss})`);
                });
            });
        });

        return {
            displayText: reservationInfo.length > 0 
                ? reservationInfo.join('\\n') 
                : "No Loot Reservations",
            totalReservations: totalReservations
        };
    }

    static generateReservationList(reservationsData) {
        const reservations = [];

        Object.values(reservationsData.weekly_reservations).forEach(weekReservations => {
            Object.values(weekReservations).forEach(userReservation => {
                userReservation.items.forEach(item => {
                    reservations.push({
                        character: userReservation.character_name,
                        item: item.name,
                        boss: item.boss
                    });
                });
            });
        });

        return reservations.map(r => 
            `{character = "${r.character}", item = "${r.item}", boss = "${r.boss}"}`
        ).join(',\n    ');
    }

    static getReservationDetailsAlternative(reservationsData) {
        if (!reservationsData || !reservationsData.weekly_reservations) {
            return { 
                displayText: "No Loot Reservations",
                totalReservations: 0
            };
        }

        let totalReservations = 0;
        const reservationInfo = [];

        Object.values(reservationsData.weekly_reservations).forEach(weekReservations => {
            Object.values(weekReservations).forEach(userReservation => {
                userReservation.items.forEach(item => {
                    totalReservations++;
                    reservationInfo.push(`${userReservation.character_name}: ${item.name} (${item.boss})`);
                });
            });
        });

        return {
            displayText: reservationInfo.length > 0 
                ? reservationInfo.join('\\n') 
                : "No Loot Reservations",
            totalReservations: totalReservations
        };
    }

    static generateReservationsLuaInit(reservationsData) {
        if (!reservationsData || !reservationsData.weekly_reservations) {
            return '';
        }

        const reservations = [];
        Object.values(reservationsData.weekly_reservations).forEach(weekReservations => {
            Object.values(weekReservations).forEach(userReservation => {
                userReservation.items.forEach(item => {
                    reservations.push(`["${item.id}"] = {
                        name = "${item.name.replace(/"/g, '\\"')}",
                        boss = "${item.boss.replace(/"/g, '\\"')}",
                        character = "${userReservation.character_name.replace(/"/g, '\\"')}"
                    }`);
                });
            });
        });

        return reservations.join(',');
    }

    static serializeToLua(obj) {
        // Convert JS object to Lua table format
        return JSON.stringify(obj).replace(/"/g, '\\"');
    }

    static generateInitCode() {
        return `function()
            -- Initialize our reservations lookup table
            aura_env.reservationMap = {}
            for _, res in ipairs(aura_env.config.reservations) do
                -- Create array for each item if it doesn't exist
                if not aura_env.reservationMap[res.itemId] then
                    aura_env.reservationMap[res.itemId] = {
                        name = res.itemName,
                        reservers = {},
                        boss = res.boss
                    }
                end
                -- Add character to the reservers list
                table.insert(aura_env.reservationMap[res.itemId].reservers, res.characterName)
            end

            -- Create our custom frame if it doesn't exist
            if not aura_env.reservationFrame then
                local frame = CreateFrame("Frame", nil, UIParent)
                frame:SetSize(400, 300)  -- Made larger to accommodate more text
                frame:SetPoint("CENTER")
                frame:SetFrameStrata("HIGH")
                
                -- Add background
                frame:SetBackdrop({
                    bgFile = "Interface\\DialogFrame\\UI-DialogBox-Background",
                    edgeFile = "Interface\\DialogFrame\\UI-DialogBox-Border",
                    tile = true,
                    tileSize = 32,
                    edgeSize = 32,
                    insets = { left = 11, right = 12, top = 12, bottom = 11 },
                })
                
                -- Add title text
                local title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
                title:SetPoint("TOP", 0, -15)
                title:SetText("Item Reservations")
                
                -- Add close button
                local closeButton = CreateFrame("Button", nil, frame, "UIPanelCloseButton")
                closeButton:SetPoint("TOPRIGHT", -5, -5)
                
                -- Add content text
                local content = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
                content:SetPoint("TOPLEFT", 20, -40)
                content:SetPoint("BOTTOMRIGHT", -20, 20)
                content:SetJustifyH("LEFT")
                
                -- Store references
                frame.content = content
                frame:Hide()
                aura_env.reservationFrame = frame
            end
        end`;
    }

    static generateStartCode() {
        return `function(event)
            local items = GetLootInfo()
            if not items then return end
            
            local foundReservations = false
            local displayText = ""
            
            for i, item in ipairs(items) do
                local itemId = tostring(item.item:match("item:(%d+)"))
                local itemData = aura_env.reservationMap[itemId]
                
                if itemData then
                    foundReservations = true
                    -- Found a reserved item
                    if displayText ~= "" then
                        displayText = displayText .. "\\n\\n"
                    end
                    
                    -- Add item header
                    displayText = displayText .. string.format(
                        "|cFFFFD100%s|r\\n|cFFFFFFFF%s|r\\n",
                        itemData.name,
                        string.rep("-", 20)
                    )
                    
                    -- Add all reservers
                    for _, reserver in ipairs(itemData.reservers) do
                        displayText = displayText .. string.format(
                            "|cFF00FF00%s|r\\n",
                            reserver
                        )
                    end
                end
            end
            
            if foundReservations then
                aura_env.reservationFrame.content:SetText(displayText)
                aura_env.reservationFrame:Show()
                return true
            end
        end`;
    }

    static async generateLootReservationWAAlternative(reservationsData) {
        // Get reservation details
        const reservationDetails = this.getReservationDetailsAlternative(reservationsData);

        // Generate Lua script for WeakAura
        const luaScript = this.generateLuaScript(reservationsData);

        // Compress and encode the Lua script
        const compressedScript = zlib.gzipSync(Buffer.from(luaScript, 'utf8'));

        // Return WeakAura import string
        return `!WA:2!${this.encodeToWeakAuraBase64(compressedScript)}`;
    }

    static testWeakAuraEncoding(luaScript) {
        try {
            console.log('--- WeakAura Encoding Test ---');
            console.log('Original Lua Script Length:', luaScript.length);

            // Compress the script
            const compressedBuffer = zlib.gzipSync(Buffer.from(luaScript, 'utf8'));
            console.log('Compressed Buffer Length:', compressedBuffer.length);

            // Encode to WeakAura base64
            const encodedScript = this.encodeToWeakAuraBase64(compressedBuffer);
            console.log('Encoded Script Length:', encodedScript.length);
            console.log('Encoded Script (first 50 chars):', encodedScript.substring(0, 50));

            // Attempt to decode
            const fullWeakAuraString = `!WA:2!${encodedScript}`;
            console.log('Full WeakAura String Length:', fullWeakAuraString.length);

            // Remove the !WA:2! prefix for decoding
            const strippedEncodedScript = fullWeakAuraString.replace('!WA:2!', '');

            // Decode the script
            const decodedBuffer = this.decodeFromWeakAuraBase64(strippedEncodedScript);
            console.log('Decoded Buffer Length:', decodedBuffer.length);

            // Verify decompression
            const decompressedScript = zlib.gunzipSync(decodedBuffer).toString('utf8');
            console.log('Decompressed Script Length:', decompressedScript.length);
            console.log('Decompressed Script (first 100 chars):', decompressedScript.substring(0, 100));

            // Compare original and decompressed scripts
            const isScriptMatching = decompressedScript.trim() === luaScript.trim();
            console.log('Original Script Matches Decompressed:', isScriptMatching);

            return {
                original: luaScript,
                compressed: compressedBuffer,
                encoded: encodedScript,
                decoded: decodedBuffer,
                decompressed: decompressedScript,
                isMatching: isScriptMatching
            };
        } catch (error) {
            console.error('WeakAura Encoding Test Failed:', error);
            throw error;
        }
    }

    static runEncodingTest(luaScript) {
        try {
            const testResult = this.testWeakAuraEncoding(luaScript);
            console.log('WeakAura Encoding Test Completed Successfully');
            return testResult;
        } catch (error) {
            console.error('WeakAura Encoding Test Failed', error);
            return null;
        }
    }

    static encodeToWeakAuraBase64(buffer) {
        // Standard base64 encoding
        const base64 = buffer.toString('base64');
        
        // WeakAura-specific character replacements
        return base64
            .replace(/\+/g, '(')   // Replace + with (
            .replace(/\//g, ')')   // Replace / with )
            .replace(/=/g, '')     // Remove padding
            .replace(/l/g, 'I')    // Replace lowercase l with uppercase I
            .replace(/O/g, '0')    // Replace uppercase O with 0
            .replace(/\s/g, '')    // Remove any whitespace
            .replace(/\n/g, '');   // Remove newlines
    }

    static decodeFromWeakAuraBase64(str) {
        try {
            // Validate input
            if (!str || typeof str !== 'string') {
                throw new Error('Invalid input: must be a non-empty string');
            }

            // Reverse the custom base64 encoding
            const standardBase64 = str
                .replace(/\(/g, '+')   // Replace ( with +
                .replace(/\)/g, '/')   // Replace ) with /
                .replace(/I/g, 'l')    // Replace uppercase I with lowercase l
                .replace(/0/g, 'O')    // Replace 0 with uppercase O
                .replace(/\s/g, '')    // Remove any whitespace
                .replace(/\n/g, '');   // Remove newlines

            console.log('Original WeakAura String:', str);
            console.log('Converted Standard Base64:', standardBase64);

            // Add padding if needed
            const paddedBase64 = standardBase64 + '==='.slice(0, (4 - standardBase64.length % 4) % 4);

            console.log('Padded Base64:', paddedBase64);

            try {
                // Decode using gzip (matching compression method)
                const decompressedBuffer = zlib.gunzipSync(Buffer.from(paddedBase64, 'base64'));
                
                console.log('Decompressed Buffer Length:', decompressedBuffer.length);
                console.log('Decompressed Buffer Start:', decompressedBuffer.toString('utf8').substring(0, 100));

                return decompressedBuffer;
            } catch (decompressError) {
                console.error('Decompression Error Details:', {
                    errorName: decompressError.name,
                    errorMessage: decompressError.message,
                    originalString: str,
                    standardBase64: standardBase64,
                    paddedBase64: paddedBase64
                });
                throw decompressError;
            }
        } catch (error) {
            console.error('Base64 Decoding Error:', error);
            throw error;
        }
    }
}

module.exports = WeakAuraGenerator;