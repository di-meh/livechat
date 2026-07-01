import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Client } from 'discord.js'
import type { BotEvent } from '../types/bot.js'

async function collectEventFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true })
	const files = await Promise.all(
		entries.map(async (entry) => {
			const resolved = join(directory, entry.name)

			if (entry.isDirectory()) {
				return collectEventFiles(resolved)
			}

			if (!entry.isFile() || !entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
				return []
			}

			return [resolved]
		})
	)

	return files.flat()
}

export async function loadEvents(client: Client): Promise<void> {
	const sourceDirectory = join(process.cwd(), process.env.NODE_ENV === 'production' ? 'dist/src' : 'src', 'bot', 'events')
	const eventFiles = await collectEventFiles(sourceDirectory)

	for (const file of eventFiles) {
		const module = (await import(pathToFileURL(file).href)) as { default?: BotEvent } & Partial<BotEvent>
		const event = module.default ?? module

		if (!event?.name || !event.execute) {
			throw new Error(`Événement invalide : ${file}`)
		}

		const execute = event.execute

		if (event.once) {
			client.once(event.name, (...args) => execute(...args))
			continue
		}

		client.on(event.name, (...args) => execute(...args))
	}
}
