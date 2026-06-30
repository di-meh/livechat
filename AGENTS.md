# AGENTS.md

## Commands

- Use `pnpm`, not `npm`; the repo is locked with `pnpm-lock.yaml` and the Docker build runs `pnpm install --frozen-lockfile`.
- Install with `pnpm install`.
- Start local development with `pnpm run dev`. This runs `robox dev`, which boots both the Robo bot/server side and the Vite React app.
- Build with `pnpm run build` and run production with `pnpm run start`.
- Format with `pnpm run fmt` or `pnpm run lint:style` (`oxfmt`). Check formatting with `pnpm run fmt:check`.
- Lint with `pnpm run lint`; apply safe fixes with `pnpm run lint:fix`.
- There is no dedicated checked-in test script. For focused verification, use `pnpm exec tsc --noEmit`.

## Setup

- Tool versions are locked in `mise.toml`; use Node `26.4.0` and pnpm `11.9.0` unless you are intentionally updating the runtime/toolchain.
- Copy `.env.example` to `.env` before running locally. Required variables verified in the example file: `PORT`, `DISCORD_CLIENT_ID`, `DISCORD_TOKEN`, `DISCORD_GUILD_ID`.
- `NODE_OPTIONS="--enable-source-maps"` is part of the documented local env setup in `.env.example`.
- The frontend port comes from `PORT`; `.env.example` defaults to `8080`, even though the README still mentions `3000`.

## Dependencies

- Core runtime: `robo.js`, `discord.js`, `@robojs/server`, `@robojs/sync`.
- Frontend: `react`, `react-dom`, `vite`, `@vitejs/plugin-react-swc`.
- UI/media: `tailwindcss`, `@tailwindcss/vite`, `@vidstack/react`.
- Tooling: `typescript`, `oxlint`, `oxfmt`, `@swc/core`.

## Architecture

- This is a single-package Robo.js app, not a monorepo.
- Real entrypoints are file-based Robo directories under `src/`:
  - `src/app/` for the React client
  - `src/api/` for HTTP routes
  - `src/commands/` for Discord slash commands
  - `src/events/` for bot lifecycle/event handlers
- `src/app/index.tsx` wraps the app in `SyncContextProvider`; the browser UI is driven by `@robojs/sync` state.
- `src/app/App.tsx` is the real livechat renderer: it consumes `useSyncState<LiveChatData[]>([], ['livechat'])`, displays one queued item at a time, and advances on timeout or media end.
- The Discord commands in `src/commands/livechat/*.ts` push items into Robo state under `getState<LiveChatData[]>('livechat-queue')` and then broadcast websocket payloads with key `['livechat']`.
- `src/events/clientReady.ts` is the bridge back from websocket messages into Robo state via `setState('livechat-queue', data)`.

## Quirks

- Do not assume the README scaffold sections are authoritative; much of it is template text. Prefer `package.json`, `config/*.mjs`, and `src/**`.
- `config/robo.mjs` ignores `src/app`, `src/components`, and `src/hooks` in the Robo watcher. Frontend changes are expected to be handled by Vite, not the bot watcher.
- `config/vite.mjs` binds the dev server to `0.0.0.0` and allows all hosts.
- `config/plugins/robojs/server.mjs` uses `ROBO_HOSTNAME ?? 'localhost'`; production `fly.toml` sets `ROBO_HOSTNAME='0.0.0.0'`.
- Formatting is configured in `.oxfmtrc.json`: tabs, `semi: false`, single quotes, width `120`, trailing commas disabled.

## Verification

- Safe minimal verification after code changes is `pnpm exec tsc --noEmit`.
- Run `pnpm run build` when changes touch app wiring, Robo commands/events, or deployment behavior, because that is the same build used by Docker/Fly.
