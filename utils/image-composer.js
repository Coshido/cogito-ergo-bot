const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Try to register fonts from multiple potential locations
const fontPaths = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    path.join(__dirname, '../assets/DejaVuSans.ttf')
];

let fontRegistered = false;
for (const fontPath of fontPaths) {
    try {
        registerFont(fontPath, { family: 'DejaVu Sans' });
        console.log(`Registered font from: ${fontPath}`);
        fontRegistered = true;
        break;
    } catch (error) {
        console.warn(`Could not register font from ${fontPath}:`, error.message);
    }
}

if (!fontRegistered) {
    console.error('Could not register any fonts. Text rendering may be affected.');
}

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

                ctx.font = 'bold 48px "DejaVu Sans"';
                const nameLines = this.wrapText(ctx, item.name, textWidth - padding);
                nameLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });

                ctx.font = '42px "DejaVu Sans"';
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
        const itemSize = this.ITEM_SIZE;
        const padding = this.PADDING;
        const textWidth = this.TEXT_WIDTH;
        const lineHeight = 45;

        const canvas = createCanvas(
            2 * (itemSize + textWidth + padding) + padding,
            itemSize + 2 * padding + 50
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
                textY += 7;
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
}

module.exports = ImageComposer;