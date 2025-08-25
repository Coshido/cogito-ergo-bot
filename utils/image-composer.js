const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

function safeRegisterFont() {
    const regularFontPath = path.resolve(__dirname, '../assets/DejaVuSans.ttf');
    const boldFontPath = path.resolve(__dirname, '../assets/DejaVuSans-Bold.ttf');

    try {
        // Register regular font
        if (!fs.existsSync(regularFontPath)) {
            throw new Error(`Regular font file does not exist: ${regularFontPath}`);
        }
        
        registerFont(regularFontPath, { 
            family: 'DejaVu Sans', 
            weight: 'normal',
            style: 'normal'
        });
        console.log('DejaVu Sans regular font registered successfully');

        // Register bold font
        if (!fs.existsSync(boldFontPath)) {
            console.warn(`Bold font file not found: ${boldFontPath}`);
            return true;
        }
        
        registerFont(boldFontPath, { 
            family: 'DejaVu Sans', 
            weight: 'bold',
            style: 'normal'
        });
        console.log('DejaVu Sans bold font registered successfully');

        return true;

    } catch (error) {
        console.error('Font registration failed:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        return false;
    }
}

// Attempt to register font during module load
const fontRegistered = safeRegisterFont();

class ImageComposer {
    // Common constants at class level
    static ITEM_SIZE = 256;
    static PADDING = 40;
    static TEXT_WIDTH = 500;
    static LINE_HEIGHT = 55;

    // Add a helper function for text wrapping
    static wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    // Add a helper function to format item type
    static formatItemType(type) {
        return type.toLowerCase() === 'non equipaggiabile cianfrusaglie' ? 'Emblema' : type;
    }

    // Safe image loading method
    static async safeLoadImage(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Cogito Ergo Bot Image Fetcher'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            clearTimeout(timeoutId);

            return await loadImage(Buffer.from(buffer));
        } catch (error) {
            console.error(`Failed to load image from ${url}:`, error);
            
            // Fallback to a placeholder
            const placeholderCanvas = createCanvas(256, 256);
            const ctx = placeholderCanvas.getContext('2d');
            ctx.fillStyle = '#808080';  // Gray placeholder
            ctx.fillRect(0, 0, 256, 256);
            
            return placeholderCanvas;
        }
    }

    static async createLootTable(items, columns = 2) {
        const itemSize = this.ITEM_SIZE;
        const padding = this.PADDING;
        const textWidth = this.TEXT_WIDTH;
        const lineHeight = this.LINE_HEIGHT;
        const rowHeight = Math.max(itemSize, lineHeight * 4) + padding * 2;
        const rows = Math.ceil(items.length / columns);

        const canvas = createCanvas(
            (itemSize + textWidth + padding) * columns + padding,
            rows * rowHeight + padding
        );
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#2f3136';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFFFFF';

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const column = i % columns;
            const row = Math.floor(i / columns);

            const x = column * (itemSize + textWidth + padding) + padding;
            const y = row * rowHeight + padding;

            try {
                const image = await this.safeLoadImage(item.icon);
                ctx.drawImage(image, x, y, itemSize, itemSize);

                const textX = x + itemSize + padding;
                let textY = y + 40;

                ctx.font = 'bold 48px Arial, Helvetica, sans-serif';
                const nameLines = this.wrapText(ctx, item.name, textWidth - padding);
                nameLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });

                ctx.font = '42px Arial, Helvetica, sans-serif';
                textY += 5;
                const typeLines = this.wrapText(ctx, `Tipo: ${this.formatItemType(item.type)}`, textWidth - padding);
                typeLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });

            } catch (error) {
                console.error(`Failed to load image for item ${item.name}:`, error);
            }
        }

        return canvas.toBuffer();
    }

    /**
     * Create a single combined image for all bosses' reservations.
     * sections: Array<{ bossName: string, items: Array<{ name: string, image_url?: string, reservers: Array<{username: string, characterName: string}> }> }>
     */
    static async createAllReservationsImage(sections) {
        if (!fontRegistered) {
            throw new Error('Unable to register font. Cannot generate image.');
        }

        const ICON = 64;
        const PADDING = 24;
        const TEXT_COL_WIDTH = 900;
        const LINE_H = 36;
        const BOSS_HEADER_H = 64 + PADDING; // title + spacing

        // Pre-measure to compute canvas height
        const measureCanvas = createCanvas(10, 10);
        const mctx = measureCanvas.getContext('2d');
        const wrap = (font, text) => {
            mctx.font = font;
            const words = String(text || '').split(' ');
            const lines = [];
            let cur = words[0] || '';
            for (let i = 1; i < words.length; i++) {
                const w = words[i];
                if (mctx.measureText(cur + ' ' + w).width < TEXT_COL_WIDTH) cur += ' ' + w; else { lines.push(cur); cur = w; }
            }
            if (cur) lines.push(cur);
            return lines.length || 1;
        };

        let totalHeight = PADDING; // top padding
        sections.forEach(sec => {
            if (!sec.items || sec.items.length === 0) return;
            totalHeight += BOSS_HEADER_H;
            sec.items.forEach(item => {
                const nameLines = wrap('bold 28px "DejaVu Sans"', item.name);
                const reserverCount = (item.reservers || []).length;
                const reserverHeight = reserverCount * LINE_H;
                const blockHeight = Math.max(ICON, nameLines * LINE_H) + reserverHeight + PADDING;
                totalHeight += blockHeight + PADDING; // item block + spacing
            });
            totalHeight += PADDING; // extra spacing after boss
        });

        const width = PADDING + ICON + PADDING + TEXT_COL_WIDTH + PADDING;
        const height = Math.max(totalHeight, 200);

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#2f3136';
        ctx.fillRect(0, 0, width, height);

        let y = PADDING;
        for (const sec of sections) {
            if (!sec.items || sec.items.length === 0) continue;

            // Boss header
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 40px "DejaVu Sans"';
            ctx.fillText(String(sec.bossName || '').toUpperCase(), PADDING, y + 40);
            y += BOSS_HEADER_H;

            for (const item of sec.items) {
                // Icon
                try {
                    const img = await this.safeLoadImage(item.image_url || item.icon);
                    ctx.drawImage(img, PADDING, y, ICON, ICON);
                } catch {}

                // Texts
                let textX = PADDING + ICON + PADDING;
                let textY = y + 28;

                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 28px "DejaVu Sans"';
                const nameLines = this.wrapText(ctx, String(item.name || ''), TEXT_COL_WIDTH);
                nameLines.forEach(line => { ctx.fillText(line, textX, textY); textY += LINE_H; });

                const reservers = item.reservers || [];
                if (reservers.length > 0) {
                    ctx.font = '24px "DejaVu Sans"';
                    reservers.forEach(r => {
                        const line = `- ${r.username} (${r.characterName || 'Unknown'})`;
                        ctx.fillText(line, textX, textY);
                        textY += LINE_H;
                    });
                }

                // Advance y for next item
                y = Math.max(y + ICON + PADDING, textY + PADDING);
            }

            y += PADDING; // spacing after boss
        }

        return canvas.toBuffer();
    }

    static async createReservationImage(items) {
        if (!fontRegistered) {
            throw new Error('Unable to register font. Cannot generate image.');
        }

        console.log('Creating reservation image for items:', items.map(item => item.name));

        const itemSize = this.ITEM_SIZE;
        const padding = this.PADDING;
        const textWidth = this.TEXT_WIDTH;
        const lineHeight = this.LINE_HEIGHT;

        const canvas = createCanvas(
            2 * (itemSize + textWidth + padding) + padding,
            itemSize + 2 * padding
        );
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#2f3136';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < items.length; i++) {
            const x = i * (itemSize + textWidth + padding) + padding;
            const y = padding;

            try {
                const image = await this.safeLoadImage(items[i].icon);
                ctx.drawImage(image, x, y, itemSize, itemSize);

                ctx.fillStyle = '#FFFFFF';

                const textX = x + itemSize + padding;
                let textY = y + 40;

                ctx.font = 'bold 42px "DejaVu Sans"';
                const nameLines = this.wrapText(ctx, items[i].name, textWidth - padding);
                nameLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });

                ctx.font = '37px "DejaVu Sans"';
                const bossLines = this.wrapText(ctx, `From: ${items[i].boss}`, textWidth - padding);
                bossLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });

                const typeLines = this.wrapText(ctx, `Tipo: ${this.formatItemType(items[i].type)}`, textWidth - padding);
                typeLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });

            } catch (error) {
                console.error(`Failed to process item ${items[i].name}:`, error);
            }
        }

        return canvas.toBuffer();
    }

    static async generateComprehensiveBossLootImages(bosses) {
        const lootImageCacheDir = path.resolve(__dirname, '../assets/boss-loot-cache');
        
        // Ensure cache directory exists
        if (!fs.existsSync(lootImageCacheDir)) {
            fs.mkdirSync(lootImageCacheDir, { recursive: true });
        }

        const generationResults = [];

        for (const boss of bosses) {
            try {
                // Skip if no loot
                if (!boss.loot || boss.loot.length === 0) {
                    console.warn(`No loot found for boss: ${boss.name}`);
                    continue;
                }

                const safeBossName = boss.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const lootImagePath = path.join(lootImageCacheDir, `${safeBossName}_loot.png`);
                
                // Skip if loot image already exists
                if (fs.existsSync(lootImagePath)) {
                    generationResults.push({ 
                        boss: boss.name, 
                        status: 'skipped', 
                        path: lootImagePath 
                    });
                    continue;
                }

                // Generate loot image using the exact same method as when clicking a boss
                const lootImageBuffer = await this.createLootTable(boss.loot);
                fs.writeFileSync(lootImagePath, lootImageBuffer);

                generationResults.push({ 
                    boss: boss.name, 
                    status: 'generated', 
                    path: lootImagePath 
                });

                console.log(`Generated loot image for ${boss.name}`);

            } catch (error) {
                console.error(`Failed to generate loot image for ${boss.name}:`, error);
                generationResults.push({ 
                    boss: boss.name, 
                    status: 'failed', 
                    error: error.message 
                });
            }
        }

        return generationResults;
    }

    static async loadCachedBossLootImage(bossName) {
        const lootImageCacheDir = path.resolve(__dirname, '../assets/boss-loot-cache');
        const safeBossName = bossName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const lootImagePath = path.join(lootImageCacheDir, `${safeBossName}_loot.png`);

        if (fs.existsSync(lootImagePath)) {
            return fs.readFileSync(lootImagePath);
        }

        return null;
    }

    /**
     * Create a reservation summary image grouped by a single boss.
     * items: Array<{ name: string, image_url?: string, reservers: Array<{username: string, characterName: string}> }>
     */
    static async createBossReservationsImage(bossName, items) {
        if (!fontRegistered) {
            throw new Error('Unable to register font. Cannot generate image.');
        }

        // Layout constants for this image type
        const ICON = 64;
        const PADDING = 24;
        const TEXT_COL_WIDTH = 900;
        const LINE_H = 36;
        const ITEM_BLOCK_MIN_H = ICON + PADDING; // at least icon height

        // Estimate height: per item (name + reservers), no boss header
        let totalHeight = PADDING; // top padding

        // We measure text roughly by counting lines after wrapping
        // Prepare a temp canvas ctx for measurement
        const measureCanvas = createCanvas(10, 10);
        const mctx = measureCanvas.getContext('2d');
        mctx.font = 'bold 32px "DejaVu Sans"';

        // Helper to wrap lines approximately
        const wrap = (font, text) => {
            mctx.font = font;
            const words = String(text || '').split(' ');
            const lines = [];
            let cur = words[0] || '';
            for (let i = 1; i < words.length; i++) {
                const w = words[i];
                if (mctx.measureText(cur + ' ' + w).width < TEXT_COL_WIDTH) cur += ' ' + w; else { lines.push(cur); cur = w; }
            }
            if (cur) lines.push(cur);
            return lines.length || 1;
        };

        items.forEach(item => {
            const nameLineCount = wrap('bold 28px "DejaVu Sans"', item.name);
            const reserverLines = (item.reservers || []).length; // one line per reserver, same as render
            const contentHeight = (nameLineCount + reserverLines) * LINE_H;
            const blockHeight = Math.max(ITEM_BLOCK_MIN_H, contentHeight) + PADDING; // include inner padding
            totalHeight += blockHeight + PADDING; // spacing between items
        });

        const width = PADDING + ICON + PADDING + TEXT_COL_WIDTH + PADDING;
        const height = Math.max(totalHeight, PADDING * 2 + ICON);

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#2f3136';
        ctx.fillRect(0, 0, width, height);

        // Start below top padding, no boss header text inside image
        ctx.fillStyle = '#FFFFFF';
        let y = PADDING;

        for (const item of items) {
            // Icon
            try {
                const img = await this.safeLoadImage(item.image_url || item.icon);
                ctx.drawImage(img, PADDING, y, ICON, ICON);
            } catch {}

            // Texts
            let textX = PADDING + ICON + PADDING;
            let textY = y + 28;

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 28px "DejaVu Sans"';
            const nameLines = this.wrapText(ctx, String(item.name || ''), TEXT_COL_WIDTH);
            nameLines.forEach(line => { ctx.fillText(line, textX, textY); textY += LINE_H; });

            const reservers = item.reservers || [];
            if (reservers.length > 0) {
                ctx.font = '24px "DejaVu Sans"';
                reservers.forEach(r => {
                    const line = `- ${r.username} (${r.characterName || 'Unknown'})`;
                    ctx.fillText(line, textX, textY);
                    textY += LINE_H;
                });
            }

            // Next block: ensure at least ICON+padding space, or enough for all text + padding
            y = Math.max(y + ICON + PADDING * 2, textY + PADDING);
        }

        return canvas.toBuffer();
    }
}

module.exports = ImageComposer;