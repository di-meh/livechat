# AGENTS.md

## Overview

- This repository is a single-package Node.js application built around `hono`, `discord.js`, and `ws`.
- It serves a static browser client from `public/` and synchronizes livechat playback over websocket.
- The bot and HTTP/websocket server run in the same process.
- The runtime is ESM (`"type": "module"` in `package.json`). Use `.js` suffixes in TypeScript relative imports.

## Tooling

- Use `pnpm`, not `npm`.
- Tool versions are pinned in `mise.toml`:
  - Node `26.4.0`
  - pnpm `11.9.0`
- Install dependencies with `pnpm install`.

## Commands

- Start local development with `pnpm run dev`.
  - This runs `tsx watch src/index.ts`.
  - It loads env vars through `varlock/auto-load` from `src/index.ts`.
- Typecheck with `pnpm run typecheck`.
- Build with `pnpm run build`.
  - This runs `tsc -p tsconfig.build.json` and outputs `dist/src/**`.
- Start production with `pnpm run start`.
  - This runs `node dist/src/index.js`.
- Format with `pnpm run fmt` or `pnpm run lint:style`.
- Check formatting with `pnpm run fmt:check`.
- Lint with `pnpm run lint`.
- Apply safe lint fixes with `pnpm run lint:fix`.

## Environment

- The source of truth for env configuration is `.env.schema`.
- Use `pnpm exec varlock load` to validate and resolve env vars.
- Required environment variables:
  - `PORT`
  - `DISCORD_CLIENT_ID`
  - `DISCORD_TOKEN`
- Optional but normally expected:
  - `DISCORD_GUILD_ID`
    - If set, slash commands are registered to that guild.
    - If absent, commands are registered globally.
- If you add new env vars, update `.env.schema` instead of introducing a new `.env.example` flow.

## Dependencies

### Runtime

- `@hono/node-server`
  - Node server adapter for Hono.
- `hono`
  - HTTP app and routing.
- `discord.js`
  - Discord bot client, slash commands, REST registration.
- `ws`
  - Websocket server.
- `varlock`
  - Resolves and loads env vars at startup.

### Dev Tooling

- `typescript`
- `tsx`
- `oxlint`
- `oxfmt`
- `@types/node`
- `@types/ws`

### Browser-side Media

- Vidstack is used via CDN in `public/index.html`, not via npm runtime imports.
- The page loads:
  - `https://cdn.jsdelivr.net/npm/@vidstack/cdn@1.15.6/player`
  - default theme CSS
  - default video layout CSS

## File Structure

### Root

- `package.json`
  - scripts and dependencies
- `tsconfig.json`
  - typecheck config
- `tsconfig.build.json`
  - production emit config
- `Dockerfile`
  - container build for Fly / Node deployment
- `fly.toml`
  - Fly.io runtime config
- `README.md`
  - human-facing project overview
- `AGENTS.md`
  - agent-facing operational guide

### `src/`

- `src/index.ts`
  - process entrypoint
  - loads env vars through Varlock
  - starts Hono server
  - attaches websocket server
  - loads bot commands and events
  - auto-registers slash commands
  - logs into Discord

### `src/bot/`

- `src/bot/commands/*.ts`
  - one file per slash command
  - each command exports `data` and `execute`
  - these files are auto-discovered and auto-registered at startup
- `src/bot/events/*.ts`
  - one file per Discord event listener
- `src/bot/loadCommands.ts`
  - recursively scans command files
  - loads from `src/bot/commands` in dev
  - loads from `dist/src/bot/commands` in production
- `src/bot/loadEvents.ts`
  - recursively scans event files
- `src/bot/registerCommands.ts`
  - pushes slash command definitions to Discord
- `src/bot/commandHelpers.ts`
  - shared helpers for command context, target routing, and embed replies

### `src/livechat/`

- `src/livechat/constants.ts`
  - default durations and channel constants
- `src/livechat/items.ts`
  - livechat item constructors
  - item classification helpers
  - MIME support checks
  - YouTube URL validation
- `src/livechat/discord.ts`
  - Discord-specific helpers for display name, avatar, and reply embeds

### `src/server/`

- `src/server/app.ts`
  - Hono routes
  - serves `/`, `/:userId`, `/health`, and static assets
- `src/server/static.ts`
  - static file serving from `public/`
- `src/server/protocol.ts`
  - websocket message types and parsing
- `src/server/websocket.ts`
  - websocket upgrade handling
  - heartbeat
  - resync snapshots
  - websocket broadcast helpers
- `src/server/channels.ts`
  - in-memory channel registry
  - per-channel queue/current item/clients/timeout state
  - diagnostics helpers used by `/ping`
- `src/server/playback.ts`
  - authoritative queue and playback transitions
  - enqueue, advance, auto-timeout, and broadcast flow

### `src/types/`

- `src/types/livechat.ts`
  - domain types for users, items, targets, channels, snapshots
- `src/types/bot.ts`
  - command and event contracts for dynamic loading

### `public/`

- `public/index.html`
  - single browser overlay page
- `public/style.css`
  - static styling for overlay UI
- `public/client.js`
  - websocket client
  - reconnection / heartbeat / state resync
  - media rendering with Vidstack custom elements
- `public/fonts/*`
  - local fonts used by the overlay

## Runtime Architecture

### HTTP

- Hono serves the overlay and health endpoint.
- Routes:
  - `/`
    - global livechat overlay
  - `/:userId`
    - targeted overlay for a specific Discord user route
  - `/health`
    - simple JSON health response
  - `/ws`
    - websocket upgrade path

### Websocket

- The browser connects to `/ws?channel=<channel>`.
- Channel naming:
  - `global`
  - `user:<discordId>`
- The server owns playback state.
- The client is read-mostly and only sends:
  - `ready`
  - `media-ended`
  - `ping`
- The server sends:
  - `hello`
  - `state`
  - `play`
  - `clear`
  - `pong`

### Discord Bot

- Slash commands are discovered from `src/bot/commands`.
- At startup, command definitions are registered automatically with Discord.
- `interactionCreate` dispatches to the loaded command map.
- Current commands include:
  - `caption`
  - `file`
  - `youtube`
  - `ping`

## Domain Model

- A livechat item targets either:
  - the global channel
  - a user-specific channel
- Supported media classes:
  - caption-only
  - image
  - audio
  - video
  - YouTube video
- Anonymous mode sets `user` to `null`.
- Playback rules:
  - captions and images auto-advance after timeout
  - playable media advance on end event or timeout
  - `maxTime` overrides natural duration behavior as a guardrail

## Workflows

### Add a New Slash Command

1. Create a new file in `src/bot/commands/`.
2. Export a `BotCommand` with:
   - `data`
   - `execute`
3. Restart the dev server.
4. The command loader will detect it.
5. The command registrar will register it automatically with Discord.

Important:

- Do not place non-command utilities inside `src/bot/commands/`.
- Shared command helpers belong in `src/bot/` outside the `commands/` folder.

### Add a New Discord Event Listener

1. Create a new file in `src/bot/events/`.
2. Export a `BotEvent` with:
   - `name`
   - optional `once`
   - `execute`
3. Restart the process.

### Change Overlay Playback Behavior

1. Update server-side playback rules in `src/server/playback.ts` first.
2. Update any item classification helpers in `src/livechat/items.ts` if needed.
3. Update browser rendering in `public/client.js` if the media UI changes.

Rule of thumb:

- Queue semantics and playback authority belong on the server.
- Browser code should not own queue mutation logic.

### Add New Static Assets

1. Put assets in `public/`.
2. If they need explicit routes, add them in `src/server/app.ts`.
3. If they are only referenced by `index.html` or CSS and already reachable by existing routes, no additional runtime logic is needed.

### Update Websocket Behavior

1. Update message contracts in `src/server/protocol.ts`.
2. Update server handling in `src/server/websocket.ts`.
3. Update client handling in `public/client.js`.
4. Keep message names and payloads aligned on both sides.

## Agent Guidance

- Prefer small, direct changes.
- Preserve the current pattern of server-authoritative playback.
- Avoid reintroducing client-owned queue mutation logic.
- Keep slash command discovery assumptions intact.
- When adding files under `src/bot/commands`, remember they will be auto-registered as commands.
- Keep browser code plain JS unless the project explicitly moves to a bundled frontend again.

## Docker / Deploy Notes

- The current `Dockerfile` is still broadly valid for this architecture:
  - installs pnpm
  - installs dependencies
  - runs `pnpm run build`
  - prunes dev dependencies
  - starts with `pnpm run start`
- It is still appropriate because production startup is plain Node on emitted JS in `dist/src/index.js`.
- If deployment issues appear, first verify:
  - `.env` / Fly secrets are present
  - `PORT` is set
  - `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` are configured

## Verification

- Minimal safe verification:
  - `pnpm run typecheck`
- Full local verification for wiring changes:
  - `pnpm run build`
- Recommended when touching websocket or playback flow:
  - open the overlay page in the browser
  - trigger a Discord command
  - verify reconnect/resync behavior by reloading or disconnecting the tab

## Quirks

- This repo no longer uses Robo.js, React, or Vite.
- Ignore any stale assumptions from older scaffolding or historical docs.
- `process.env` is loaded through `varlock/auto-load` in `src/index.ts`, not through Hono runtime helpers.
- Relative ESM imports in TypeScript must use `.js` suffixes.
