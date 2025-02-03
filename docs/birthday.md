# Birthday Commands

A set of commands to manage birthday celebrations in your server.

## Commands

### /birthday-set
Sets your birthday for server celebrations.

**Usage**: `/birthday-set day:<1-31> month:<1-12>`

**Example**: `/birthday-set day:15 month:3`

**Permission**: Everyone can use this command

**Response**: 
- Success: "Your birthday has been set to {day}/{month}! 🎂"
- Error: "Please enter a valid date!"
- Error: "There was an error setting your birthday!"

---

### /birthday-remove
Removes your birthday from the server celebrations.

**Usage**: `/birthday-remove`

**Permission**: Everyone can use this command

**Response**:
- Success: "Your birthday has been removed! 🗑️"
- Error: "You don't have a birthday set!"
- Error: "There was an error removing your birthday!"

---

### /birthday-set-channel
Sets the channel where birthday announcements will be sent.

**Usage**: `/birthday-set-channel channel:<text-channel>`

**Example**: `/birthday-set-channel channel:#birthdays`

**Permission**: Requires `MANAGE_GUILD` permission

**Response**:
- Success: "Birthday announcements will now be sent in {channel}! 🎉"
- Error: "Please select a text channel!"
- Error: "There was an error setting the birthday channel!"

## Required Bot Permissions
The bot requires the following intents:
- GUILDS
- GUILD_MESSAGES
- MESSAGE_CONTENT
- GUILD_MEMBERS

## Technical Implementation

### Files Structure 