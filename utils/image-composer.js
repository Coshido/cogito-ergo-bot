const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Attempt to register a fallback font
try {
    const systemFontsPath = process.platform === 'win32' 
        ? 'C:\\Windows\\Fonts' 
        : '/usr/share/fonts';
    
    const fallbackFonts = [
        'arial.ttf', 
        'arialbd.ttf', 
        'arial_bold.ttf', 
        'DejaVuSans.ttf', 
        'DejaVuSans-Bold.ttf'
    ];

    fallbackFonts.forEach(fontName => {
        const fontPath = path.join(systemFontsPath, fontName);
        if (fs.existsSync(fontPath)) {
            registerFont(fontPath, { family: 'Fallback Arial' });
            console.log(`Registered fallback font: ${fontName}`);
        }
    });
} catch (fontError) {
    console.error('Error registering fallback fonts:', fontError);
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

    static async safeLoadImage(url) {
        try {
            // Add a timeout to prevent hanging
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
            
            // Fallback to a placeholder image or default icon
            const placeholderPath = path.join(__dirname, '../assets/placeholder-icon.png');
            if (fs.existsSync(placeholderPath)) {
                return await loadImage(placeholderPath);
            }
            
            // If no placeholder, create a simple colored rectangle
            const canvas = createCanvas(256, 256);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#808080';  // Gray placeholder
            ctx.fillRect(0, 0, 256, 256);
            return canvas;
        }
    }

    static async createLootTable(items, columns = 2) {
        const itemSize = this.ITEM_SIZE;
        const padding = this.PADDING;
        const textWidth = this.TEXT_WIDTH;
        const lineHeight = this.LINE_HEIGHT;
        const rowHeight = Math.max(itemSize, lineHeight * 4) + padding * 2; // Adjusted for potential wrapped text
        const rows = Math.ceil(items.length / columns); // Changed to handle 2 items per row
        
        // Create canvas with appropriate size
        const canvas = createCanvas(
            (itemSize + textWidth + padding) * columns + padding,
            rows * rowHeight + padding
        );
        const ctx = canvas.getContext('2d');

        // Set background
        ctx.fillStyle = '#2f3136';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Explicitly set font with fallback
        ctx.font = '48px "Fallback Arial", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';

        // Load and draw each item with description
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const column = i % columns;
            const row = Math.floor(i / columns);
            
            const x = column * (itemSize + textWidth + padding) + padding;
            const y = row * rowHeight + padding;

            try {
                // Use safeLoadImage
                const image = await this.safeLoadImage(item.icon);
                ctx.drawImage(image, x, y, itemSize, itemSize);

                // Text position
                const textX = x + itemSize + padding;
                let textY = y + 40;

                // Draw wrapped item name with larger font
                ctx.font = 'bold 48px "Fallback Arial", Arial, sans-serif';
                const nameLines = this.wrapText(ctx, item.name, textWidth - padding);
                nameLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });
                
                // Draw type with slightly smaller font
                ctx.font = '42px "Fallback Arial", Arial, sans-serif';
                textY += 5;
                const typeLines = this.wrapText(ctx, `Tipo: ${this.formatItemType(item.type)}`, textWidth - padding);
                typeLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });

            } catch (error) {
                console.error(`Failed to process item ${item.name}:`, error);
            }
        }

        return canvas.toBuffer();
    }

    static async createReservationImage(items) {
        const itemSize = this.ITEM_SIZE;
        const padding = this.PADDING;
        const textWidth = this.TEXT_WIDTH;
        const lineHeight = this.LINE_HEIGHT;
        
        const canvas = createCanvas(
            2 * (itemSize + textWidth + padding) + padding,
            itemSize + 2 * padding
        );
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#2f3136';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Explicitly set font with fallback
        ctx.font = '48px "Fallback Arial", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';

        // Draw items with descriptions
        for (let i = 0; i < items.length; i++) {
            const x = i * (itemSize + textWidth + padding) + padding;
            const y = padding;

            try {
                // Use safeLoadImage
                const image = await this.safeLoadImage(items[i].icon);
                ctx.drawImage(image, x, y, itemSize, itemSize);

                // Set text color explicitly
                ctx.fillStyle = '#FFFFFF';

                // Draw text with larger fonts
                const textX = x + itemSize + padding;
                let textY = y + 40;

                // Item name
                ctx.font = 'bold 48px "Fallback Arial", Arial, sans-serif';
                const nameLines = this.wrapText(ctx, items[i].name, textWidth - padding);
                nameLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });
                
                // Boss name
                ctx.font = '42px "Fallback Arial", Arial, sans-serif';
                textY += 10;
                const bossLines = this.wrapText(ctx, `From: ${items[i].boss}`, textWidth - padding);
                bossLines.forEach(line => {
                    ctx.fillText(line, textX, textY);
                    textY += lineHeight;
                });

                // Type
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