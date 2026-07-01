# Livechat

Un bot Discord et serveur Hono qui diffusent des médias vers une page navigateur via WebSocket. Inspiré par le groupe de streamers [Cacabox](https://www.twitch.tv/team/cacabox).

## Stack

- `discord.js` pour le bot et les slash commands
- `hono` pour le serveur HTTP
- `ws` pour le websocket
- `Vidstack` via CDN pour la lecture média dans le navigateur
- `varlock` pour le chargement et la validation des variables d'environnement

## Structure

```txt
src/
  index.ts
  bot/
    commands/
    events/
  livechat/
  server/
  types/

public/
  index.html
  style.css
  client.js
  fonts/
```

## Fonctionnement

1. Les slash commands sont détectées automatiquement depuis `src/bot/commands`.
2. Au démarrage, elles sont enregistrées automatiquement sur Discord.
3. Chaque commande ajoute un élément à la file d'un canal livechat :
   - global sur `/`
   - cible utilisateur sur `/:discordUserId`
4. Le serveur garde l'état autoritaire de la queue et du média en cours.
5. Tous les clients connectés à un même canal reçoivent exactement le même média en même temps.

## Installation

```bash
mise install
pnpm install
pnpm exec varlock load
```

La source de vérité de la configuration est `.env.schema`.

Renseigne ensuite les valeurs sensibles et locales dans ton setup Varlock ou dans tes fichiers `.env` locaux, puis valide avec `pnpm exec varlock load`.

Variables attendues :

- `PORT`
- `DISCORD_CLIENT_ID`
- `DISCORD_TOKEN`
- `DISCORD_GUILD_ID`

## Développement

```bash
pnpm run dev
```

Le flux global est disponible sur `http://localhost:8080/`.

Un flux cible utilisateur est disponible sur `http://localhost:8080/<discordUserId>`.

## Scripts

```bash
pnpm run dev
pnpm run typecheck
pnpm run build
pnpm run start
pnpm run fmt
pnpm run lint
```

## Vérification conseillée

```bash
pnpm run typecheck
pnpm run build
```
