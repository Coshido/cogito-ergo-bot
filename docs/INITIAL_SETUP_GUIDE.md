# Bot Initial Setup Guide

## Overview
This guide will walk you through the initial configuration of the Discord bot, covering role setups, channel configurations, and other essential initial steps.

## Prerequisites
- Discord server with administrative permissions
- Bot invited to the server with necessary permissions
- Roles created for different bot functionalities

## 1. Loot Reservation Setup
### Roles
- Create roles:
  * Raid Leader Role
  * Raider Role

### Commands
```
/reserve-setup raid-leader-role # Set raid leader role (ADMIN ONLY)
/reserve-setup raider-role      # Set raider role (ADMIN ONLY)
```

### Reserve Commands and Permissions
- Reserve listing and management commands are restricted to Raid Leaders at runtime (via `isRaidLeader`).
- To also HIDE these commands from non–Raid Leaders in the Discord UI, configure Server Integrations (recommended):
  1. Server Settings → Integrations → your bot → Commands
  2. For each reserve command (e.g., `reserve-list`, `reserve-generate`, `reserve-clear`):
     - Set "Who can use" to specific roles → select only your Raid Leader role
  3. For setup commands (`reserve-setup`, `reserve set-channel`), allow only Administrators


## 2. Birthday Tracking Setup
### Channels
- Create a dedicated channel for birthday announcements

### Commands
```
/birthday-config channel # Set birthday announcement channel
```

## 3. General Bot Configuration

### Recommended Role Hierarchy
1. Administrator (highest)
2. Raid Leaders
3. Raiders
4. Members (lowest)

### Permission Considerations
- Ensure bot has:
  * Manage Roles
  * Manage Channels
  * Send Messages
  * Read Message History
  * Add Reactions
  * Attach Files (for image mode)

## 4. Environment Configuration
- Set up `.env` file with:
  * `BOT_TOKEN`
  * `CLIENT_ID`
  * `GUILD_ID`


### Channel Visibility Recommendations
- Create these channels as private
- Limit access to administrators and specific management roles
- Use these channels exclusively for bot configuration and management

### Benefits of Dedicated Channels
- Centralized command execution
- Clear audit trail
- Reduced channel noise
- Improved security by limiting command access

### Implementation Steps
1. Create the dedicated channels
2. Set appropriate permissions
3. Communicate channel purpose to server administrators
4. Configure bot to recognize these channels for specific commands

## Troubleshooting
- Verify bot permissions
- Check role hierarchies
- Ensure bot has necessary intents enabled
- Restart bot after configuration changes

## Best Practices
- Create roles specifically for bot functions
- Use dedicated channels for each bot feature
- Regularly audit role and channel permissions
- Keep bot and server roles organized

## Common Issues
- Bot not responding to commands
  * Check bot online status
  * Verify role permissions
  * Confirm bot has required intents

- Commands not working
  * Verify role setup
  * Check channel configurations
  * Ensure user has correct roles

## Additional Resources
- Discord Developer Portal
- Bot documentation
- Server settings guide

## Version Compatibility
- Always check bot documentation for version-specific setup requirements

## Security Recommendations
- Use principle of least privilege
- Regularly review and update role permissions
- Monitor bot activity logs

---

**Note**: This is a living document. Always refer to the most recent version of the bot documentation.
