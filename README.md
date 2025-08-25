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


## License
MIT
