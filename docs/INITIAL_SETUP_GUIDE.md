# Bot Initial Setup Guide

## Overview
This guide will walk you through the initial configuration of the Discord bot, covering role setups, channel configurations, and other essential initial steps.

## Prerequisites
- Discord server with administrative permissions
- Bot invited to the server with necessary permissions
- Roles created for different bot functionalities

## 1. Tournament Management Setup
### Roles
- Create roles:
  * Tournament Manager Role
  * Tournament Participant Role

### Commands
```
/t-config set-manager-role     # Set tournament manager role
/t-config set-tournament-role  # Set tournament participant role
/t-config set-channel          # Set dedicated tournament channel
```

## 2. League Management Setup
### Roles
- Create roles:
  * League Manager Role
  * League Participant Role

### Commands
```
/league-role-setup manager     # Set league manager role
/league-role-setup participant # Set league participant role
```

## 3. Loot Reservation Setup
### Roles
- Create roles:
  * Raid Leader Role
  * Raider Role

### Commands
```
/reserve-setup raid-leader-role # Set raid leader role
/reserve-setup raider-role      # Set raider role
```

## 4. Birthday Tracking Setup
### Channels
- Create a dedicated channel for birthday announcements

### Commands
```
/birthday-config channel # Set birthday announcement channel
```

## 5. General Bot Configuration

### Recommended Role Hierarchy
1. Administrator (highest)
2. Raid Leaders
3. Tournament Managers
4. League Managers
5. Raiders/Participants
6. Members (lowest)

### Permission Considerations
- Ensure bot has:
  * Manage Roles permission
  * Manage Channels permission
  * Send Messages permission
  * Read Message History
  * Add Reactions

## 6. Environment Configuration
- Set up `.env` file with:
  * `BOT_TOKEN`
  * `CLIENT_ID`
  * `GUILD_ID`

## 7. Dedicated Channels Strategy

### Recommended Channel Setup
1. **Tournament Management Channel**
   - Purpose: All tournament-related commands and announcements
   - Recommended Name: `#tournament-management`
   - Access: Administrators and Tournament Managers
   - Commands to run in this channel:
     * `/t-config set-manager-role`
     * `/t-config set-tournament-role`
     * `/t-create`
     * `/t-start`
     * `/t-end`

2. **League Management Channel**
   - Purpose: All league-related commands and announcements
   - Recommended Name: `#league-management`
   - Access: Administrators and League Managers
   - Commands to run in this channel:
     * `/league-role-setup manager`
     * `/league-role-setup participant`
     * `/league-setup`
     * `/league-match-report`

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
