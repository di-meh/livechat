import 'varlock/auto-load'
import { createServer } from 'node:http'
import { serve } from '@hono/node-server'
import type { Server } from 'node:http'
import { Client, GatewayIntentBits } from 'discord.js'
import app from './server/app.js'
import { attachWebSocketServer } from './server/websocket.js'
import { loadCommands } from './bot/loadCommands.js'
import { loadEvents } from './bot/loadEvents.js'
import { registerCommands } from './bot/registerCommands.js'
import { setInteractionCommands } from './bot/events/interactionCreate.js'

function requireEnv(name: keyof NodeJS.ProcessEnv): string {
	const value = process.env[name]

	if (!value) {
		throw new Error(`Variable d'environnement manquante: ${name}`)
	}

	return value
}

async function bootstrapDiscordBot(): Promise<Client> {
	const client = new Client({
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
	})

	const commands = await loadCommands()
	setInteractionCommands(new Map(commands))
	await loadEvents(client)
	await registerCommands(commands)
	await client.login(requireEnv('DISCORD_TOKEN'))

	return client
}

async function bootstrap() {
	requireEnv('DISCORD_CLIENT_ID')
	const port = Number(process.env.PORT || '8080')
	const server = serve({
		fetch: app.fetch,
		port,
		createServer
	}) as Server

	attachWebSocketServer(server)
	await bootstrapDiscordBot()

	console.info(`Serveur livechat à l'écoute sur le port ${port}`)
}

bootstrap().catch((error) => {
	console.error('Impossible de démarrer le projet livechat', error)
	process.exitCode = 1
})
