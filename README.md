# Cogito Ergo Bot

A Discord bot for raid loot reservations, reminders, birthday tracking, and utility commands.

## Features
- Loot reservation workflow (setup, list, clear; more in the Reserve Guide)
- Rich image output per boss for reservation lists
- Birthday reminders
- Utility commands (ping, server, user)

## Requirements
- Node.js 18+ (tested also on Node 22)
- A Discord Bot application and token
- Guild ID and Client ID

## Quick Start
1. Clone the repository and install deps:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set:
   - `BOT_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
3. Start in guild deploy mode (default in `npm run dev`):
   ```bash
   npm run dev
   ```
   This deploys slash commands to your guild and starts the bot.

## Environment
- `.env` holds secrets for local development. Do not commit real tokens.
- Command deployment is handled by `deploy-commands.js` and runs before the bot starts.
- Optional Blizzard API credentials (for data-fetch scripts only):
  - `BLITZ_CLIENT_ID`, `BLITZ_CLIENT_SECRET`, `BLITZ_REGION` (e.g., `eu`), `BLITZ_LOCALE` (e.g., `it_IT`)
  - These are used by scripts under `scripts/` to build/update `database/raid-loot.json`. The bot itself does not require them to run.

## Command Permissions (Overview)
Use both: runtime checks and Discord Integrations to hide commands.

- Runtime checks:
  - Raid-leader only commands verify roles via `isRaidLeader()`.
  - Raiders or normal members invoking these will be rejected.

- Hide commands (recommended):
  - Server Settings → Integrations → your bot → Commands
  - For each command, set “Who can use” to specific roles (e.g., Raid Leader).

### Loot Reservation Commands (overview)
- Admin-only setup:
  - `/reserve-setup raid-leader-role`
  - `/reserve-setup raider-role`
  - `/reserve set-channel`
- Raid leader only (visibility restricted via Integrations; runtime checked):
  - Common: `/reserve-list [format]`, `/reserve-clear`
- For full command details and usage, see `docs/RESERVE_GUIDE.md`.

## Initial Setup
See `docs/INITIAL_SETUP_GUIDE.md` for:
- Role creation (Raid Leader, Raider)
- Channel recommendations (`#reserve-admin`, `#reserve-info`)
- Command permission configuration via Integrations

## Development
- Commands live under `commands/` grouped by feature (e.g., `commands/loot/`).
- Event handlers in `events/` (e.g., `interactionCreate.js`).
- Utilities in `utils/` (image composer, permission checks, reservation helpers).

### Scripts (optional utilities)
- `scripts/fetch-raid-data.js` — Fetch raid journal and item data from Blizzard APIs to generate/update `database/raid-loot.json` (requires BLITZ_* env vars).
- `scripts/debug-fetch-item.js` — Fetch a single item from Blizzard APIs for debugging.
- `scripts/clear-loot-cache.js` — Clear generated image/cache files under `assets/boss-loot-cache/`.
- `scripts/clean-reservations.js` — Reset or clean up reservations data.
- `scripts/generate-mock-reserves.js` — Generate test reservations for development.
- `scripts/test-api.js` — Quick connectivity test against Blizzard APIs.

## Deploying slash commands (Guild vs Global)
- __Guild deploy (fast for testing)__
  - Default in `npm run dev` (runs guild deploy then starts the bot)
  - Or manual:
    ```bash
    node --no-warnings deploy-commands.js
    ```
- __Global deploy (for production)__
  ```bash
  node --no-warnings deploy-commands.js --global
  ```
  Note: Global changes can take minutes (up to ~1h) to propagate in clients.

### Clearing commands
- If you deploy both GLOBAL and GUILD, clients can temporarily show duplicates.
- You can clear a scope with provided flags:
  - Clear GLOBAL commands:
    ```bash
    node --no-warnings deploy-commands.js --clear-global
    ```
  - Clear GUILD commands for your `GUILD_ID`:
    ```bash
    node --no-warnings deploy-commands.js --clear-guild
    ```
After clearing or switching scopes, hard-reload Discord (Ctrl+R) if commands still appear duplicated.

## Reserve permissions management
- Runtime checks use `utils/permission-utils.js`:
  - Raid leader authorization if user has any configured Raid Leader role, or is in the allowlist `raidLeaderUserIds`.
- Admins can configure via `/reserve-setup` subcommands:
  - `roles` — set/update roles (each option is optional):
    ```
    /reserve-setup roles raid_leader_role:@RaidLeader
    /reserve-setup roles raider_role:@Raider
    ```
  - `user-add` — add a user to Raid Leader allowlist:
    ```
    /reserve-setup user-add user:@Member
    ```
  - `user-remove` — remove a user from allowlist:
    ```
    /reserve-setup user-remove user:@Member
    ```
  - `user-list` — show allowlisted users.

## License
MIT
