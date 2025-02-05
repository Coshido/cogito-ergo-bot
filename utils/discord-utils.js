const { StringSelectMenuBuilder } = require('discord.js');

function createItemSelectMenu(items, customId) {
    return new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder('Select an item to reserve')
        .addOptions(
            items.map((item, index) => ({
                label: `${index + 1}- ${item.name}`,
                description: item.type.toLowerCase() === 'non equipaggiabile cianfrusaglie' ? 'Emblema' : item.type,
                value: item.id
            }))
        );
}

module.exports = {
    createItemSelectMenu
}; 