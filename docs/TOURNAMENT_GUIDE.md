# Tournament Bot Guide

## Overview
This bot manages tournament operations with a structured flow from creation to completion. All tournament commands (except configuration) are restricted to a designated channel.

## Initial Setup
Before creating tournaments, an admin must configure:
1. Tournament Manager Role: `/t-config set-manager-role`
2. Tournament Participant Role: `/t-config set-tournament-role`
3. Tournament Channel: `/t-config set-channel`

## Tournament Lifecycle

### 1. Creation Phase
**Command**: `/t-create`
- Only usable by users with Tournament Manager role
- Sets:
  - Tournament name
  - Format (Single/Double Elimination)
  - Max participants (2-128)
- Creates initial tournament state in `config.json`
- Opens registration

### 2. Registration Phase
Participants can:
- Join: `/t-join`
- Leave: `/t-leave`
- View participants: `/t-list`
- Check status: `/t-status`

Requirements:
- Must have Tournament Role
- Must use commands in designated channel
- Cannot join if tournament is full

### 3. Tournament Phase
**Started by**: `/t-start` (Manager only)
- Closes registration
- Requires minimum 2 participants
- Enables bracket generation

Bracket Management:
1. Generate brackets: `/t-bracket` (Manager only)
2. Report results: `/t-report` (Participants/Managers)
   - Specify match number and winner
   - Winner must be a participant in the match
   - Each match can only be reported once

### 4. End Phase
**Command**: `/t-end` (Manager only)
- Archives tournament data to `database/archive/tournament-{timestamp}.json`
- Cleans up current tournament files
- Resets tournament state

## Command Reference

### Manager Commands
```
/t-create                   Create new tournament
/t-start                   Start tournament
/t-end                     End tournament
/t-bracket                 Generate brackets
```

### Participant Commands
```
/t-join                    Join tournament
/t-leave                   Leave tournament
/t-report                  Report match result
```

### General Commands
```
/t-list                    List participants
/t-status                  Show tournament status
/t-help                    Show available commands
```

### Admin Commands
```
/t-config set-manager-role     Set tournament manager role
/t-config set-tournament-role  Set participant role
/t-config set-channel         Set tournament channel
```

## File Structure
```
database/
├── config.json                # Main configuration
├── tournament-list.json       # Current participants
├── bracket.json              # Current brackets
└── archive/                  # Tournament archives
    └── tournament-{timestamp}.json

commands/tournament/
├── t-bracket.js
├── t-config.js
├── t-create.js
├── t-end.js
├── t-help.js
├── t-join.js
├── t-leave.js
├── t-list.js
├── t-report.js
├── t-start.js
└── t-status.js

utils/
└── tournamentUtils.js        # Shared utilities
```

## Tournament States
1. **Inactive**: No tournament running
   - Can create new tournament
   - Most commands disabled

2. **Registration Open**:
   - Can join/leave
   - Can't generate brackets
   - Can't report matches

3. **Tournament Active**:
   - Can't join/leave
   - Can generate brackets
   - Can report matches

## Best Practices
1. Always set up roles and channel before creating tournaments
2. Use `/t-help` to see available commands for current phase
3. Use `/t-status` to check tournament state
4. Archive is automatically created when ending tournament
5. Each tournament should have a unique name for easy reference

## Error Handling
- All commands have appropriate error messages
- Channel restrictions are enforced
- Role requirements are checked
- Tournament state is validated
- Match reporting is verified

## Future Improvements
1. Round Robin tournament format
2. Tournament scheduling
3. Match reminders
4. Participant statistics
5. Tournament history command
6. Custom bracket formats
7. Double elimination implementation
8. Tournament seeding
