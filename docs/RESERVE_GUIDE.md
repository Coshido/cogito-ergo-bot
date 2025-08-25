# Raid Reservation Bot Guide

## Overview
This bot manages item reservations for raids, providing a structured and fair system for players to reserve loot across different raid encounters.

## Initial Setup
Before using reservations, an admin must configure:
1. Raid Leader Role: `/reserve-setup raid-leader-role`
2. Raider Role: `/reserve-setup raider-role`

## Reservation Lifecycle

### 1. Role Configuration
**Commands**:
- `/reserve-setup raid-leader-role`: Set the role for raid leaders
- `/reserve-setup raider-role`: Set the role for raiders

### 2. Reservation Management
Key Commands:
- `/reserve`: Make a new item reservation
- `/reserve-list`: View current reservations (Raid Leaders only)
- `/reserve-edit`: Modify existing reservations
- `/reserve-clear`: Clear all reservations (Raid Leaders only)

### 3. Reservation Rules
- Only Raiders can make reservations
- Reservations reset weekly
- One item per boss per character
- Reservations carry over between weeks

## Command Reference

### Raider Commands
```
/reserve             Make a new item reservation
/reserve-edit        Modify existing reservations
/reserve-reminder    Configure reservation reminders
```

### Raid Leader Commands
```
/reserve-setup       Configure reservation roles
/reserve-list        View current reservations (images by default; see options below)
/reserve-clear       Clear all reservations for the week
```

### Reserve List
`/reserve-list [format]` — Raid Leaders only

- Options:
  * `format`: `images` (default) or `text`
- Behavior:
  * Default is images per boss; large outputs are split across multiple messages.
  * Image mode defers the reply to avoid timeouts; both modes reply ephemerally.
  * Cosmetic items are excluded automatically.
- Examples:
  * `/reserve-list` → images per boss (default)
  * `/reserve-list format:text` → single embedded text summary

## Reservation Process
1. Use `/reserve` to select:
   - Character name
   - Boss
   - Specific item
2. Confirm reservation
3. View reservations with `/reserve-list`

## Reminder System
**Command**: `/reserve-reminder`
- Enable/Disable reminders
- Choose reminder type:
  * No reminders
  * Remind if no reservations
  * Show current reservations
  * Both
- Select day and time for reminders

## Reminder Types
1. **No Reminders**: No notifications
2. **Unreserved Reminder**: Alerts if no reservations made
3. **Current Reservations**: Shows your current reservations
4. **Both**: Combines unreserved and current reservation alerts

## File Structure
```
database/
├── reservations.json        # Current week's reservations
├── user-preferences.json    # Reminder preferences
└── config.json              # Role configurations
```

## Best Practices
- Reserve early
- Keep character names consistent
- Check reservations regularly
- Use reminders to stay organized

## Troubleshooting
- Verify you have the Raider role
- Check reservation limits
- Contact a Raid Leader for assistance

## Advanced Features
- Automatic weekly reservation carry-over
- Flexible reminder configuration
- Easy reservation modification

## Permissions
- Reservations: Raider role
- Clearing Reservations: Raid Leader role
- Configuration: Administrator role

## Weekly Reset
- Reservations automatically carry over
- Raid Leaders can clear if needed
- Reminder system adapts to new week

## Limitations
- One reservation per boss per character
- Reservations tied to current week
- Reminders limited to once per week
