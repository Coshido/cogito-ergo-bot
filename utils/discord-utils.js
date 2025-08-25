const { StringSelectMenuBuilder } = require('discord.js');

function formatItemNameWithClasses(item) {
    if (!item) return '';
    const classes = Array.isArray(item.tokenClasses) && item.tokenClasses.length
        ? ` (${item.tokenClasses.join(', ')})`
        : '';
    return `${item.name}${classes}`;
}

function createItemSelectMenu(items, customId) {
    return new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder('Select an item to reserve')
        .addOptions(
            items.map((item, index) => ({
                label: `${index + 1}- ${formatItemNameWithClasses(item)}`,
                // For token-like items, show 'Emblema' and append classes when provided
                description: (() => {
                    const typeLower = (item.type || '').toLowerCase();
                    const isLegacyToken = typeLower === 'non equipaggiabile cianfrusaglie';
                    const isToken = typeLower === 'token';
                    if (isToken || isLegacyToken) {
                        const base = 'Emblema';
                        if (Array.isArray(item.tokenClasses) && item.tokenClasses.length) {
                            return `${base} — ${item.tokenClasses.join(', ')}`;
                        }
                        return base;
                    }
                    return item.type;
                })(),
                value: item.id
            }))
        );
}

module.exports = {
    createItemSelectMenu,
    formatItemNameWithClasses
};