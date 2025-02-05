# League Bot Guide

## Overview
This bot manages league operations with a structured round-robin format. League commands provide a comprehensive system for tracking team or player performances.

## Initial Setup
Before creating leagues, an admin must configure:
1. League Manager Role: `/league-role-setup manager`
2. League Participant Role: `/league-role-setup participant`

## League Lifecycle

### 1. Role Configuration
**Commands**:
- `/league-role-setup manager`: Set the role for league managers
- `/league-role-setup participant`: Set the role for league participants

### 2. Participant Registration
Participants can:
- Join: `/league-join`
- Leave: `/league-leave`
- View participants: `/league-participants`

Requirements:
- Must have League Participant Role
- Limited to one registration per user

### 3. League Setup
**Command**: `/league-setup`
- Creates a new league
- Automatically generates round-robin schedule
- Uses registered participants
- Initializes league standings

### 4. Match Reporting
**Command**: `/league-match-report`
- Report match results
- Provide match details:
  * Scores
  * MVP (optional)
  * Match narrative (optional)
- Automatically updates league standings

### 5. League Information
**Commands**:
- `/league-info standings`: View current league standings
- `/league-info schedule`: View match schedule

## Command Reference

### Manager Commands
```
/league-role-setup manager       Set league manager role
/league-role-setup participant   Set league participant role
/league-setup                    Create new league
/league-match-report             Report match results
```

### Participant Commands
```
/league-join                     Join the league
/league-leave                    Leave the league
```

### General Commands
```
/league-participants             List league participants
/league-info standings           View league standings
/league-info schedule            View match schedule
```

## Scoring System
- Win: 3 points
- Draw: 1 point
- Loss: 0 points

Standings are sorted by:
1. Total points
2. Goal difference
3. Goals scored

## File Structure
```
database/
├── league-config.json           # Role configurations
├── league-participants.json     # Current participants
├── league-data.json             # League matches and standings
└── league-data-archive/         # Past league data
```

## Best Practices
- Ensure fair participation
- Report matches promptly
- Maintain good sportsmanship

## Troubleshooting
- Verify roles are correctly set
- Check participant registration
- Contact a league manager for assistance
