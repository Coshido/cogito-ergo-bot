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
                const lootImagePath = path.join(lootImageCacheDir, `${safeBossName}_comprehensive_loot.png`);
                
                // Skip if loot image already exists
                if (fs.existsSync(lootImagePath)) {
                    generationResults.push({ 
                        boss: boss.name, 
                        status: 'skipped', 
                        path: lootImagePath 
                    });
                    continue;
                }

                // Generate comprehensive loot image
                const lootImageBuffer = await this.createComprehensiveLootImage(boss);
                fs.writeFileSync(lootImagePath, lootImageBuffer);

                generationResults.push({ 
                    boss: boss.name, 
                    status: 'generated', 
                    path: lootImagePath 
                });

                console.log(`Generated comprehensive loot image for ${boss.name}`);

            } catch (error) {
                console.error(`Failed to generate comprehensive loot image for ${boss.name}:`, error);
                generationResults.push({ 
                    boss: boss.name, 
                    status: 'failed', 
                    error: error.message 
                });
            }
        }

        return generationResults;
    }

    static async createComprehensiveLootImage(boss) {
        // Define image dimensions and styling
        const canvasWidth = 800;
        const canvasHeight = 600;
        const padding = 20;
        const itemSize = 100;
        const columns = 3;
        const rowSpacing = 20;
        const fontSize = 16;

        // Create canvas
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#2C2F33';  // Dark background
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Boss name
        ctx.font = 'bold 24px DejaVu Sans';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, canvasWidth / 2, padding + 30);

        // Prepare loot items
        const loot = boss.loot || [];

        // Calculate rows needed
        const rows = Math.ceil(loot.length / columns);
        const totalHeight = rows * (itemSize + rowSpacing + 40);  // Item size + spacing + text height

        // Render items
        for (let i = 0; i < loot.length; i++) {
            const item = loot[i];
            const col = i % columns;
            const row = Math.floor(i / columns);

            const x = padding + col * (itemSize + padding * 2);
            const y = padding * 2 + 50 + row * (itemSize + rowSpacing + 40);

            // Load item icon
            try {
                const image = await this.safeLoadImage(item.icon);
                
                // Draw item icon
                ctx.drawImage(image, x, y, itemSize, itemSize);

                // Item name
                ctx.font = '12px DejaVu Sans';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                const truncatedName = item.name.length > 25 
                    ? item.name.substring(0, 22) + '...' 
                    : item.name;
                ctx.fillText(truncatedName, x + itemSize / 2, y + itemSize + 15);

                // Item level
                ctx.font = '10px DejaVu Sans';
                ctx.fillStyle = '#99AAB5';  // Lighter text color
                ctx.fillText(`iLvl ${item.ilvl}`, x + itemSize / 2, y + itemSize + 30);

                // Item type
                ctx.fillText(item.type, x + itemSize / 2, y + itemSize + 45);

            } catch (error) {
                console.error(`Failed to load icon for item ${item.name}:`, error);
            }
        }

        return canvas.toBuffer('image/png');
    }

    static async loadCachedBossLootImage(bossName) {
        const lootImageCacheDir = path.resolve(__dirname, '../assets/boss-loot-cache');
        const safeBossName = bossName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const lootImagePath = path.join(lootImageCacheDir, `${safeBossName}_comprehensive_loot.png`);

        if (fs.existsSync(lootImagePath)) {
            return fs.readFileSync(lootImagePath);
        }

        return null;
    }
}

module.exports = ImageComposer;