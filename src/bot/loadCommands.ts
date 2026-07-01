import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Collection } from 'discord.js'
import { Collection as DiscordCollection } from 'discord.js'
import type { BotCommand } from '../types/bot.js'

async function collectCommandFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true })
	const files = await Promise.all(
		entries.map(async (entry) => {
			const resolved = join(directory, entry.name)

			if (entry.isDirectory()) {
				return collectCommandFiles(resolved)
			}

			if (!entry.isFile() || !entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
				return []
			}

			return [resolved]
		})
	)

	return files.flat()
}

export async function loadCommands(): Promise<Collection<string, BotCommand>> {
	const commands = new DiscordCollection<string, BotCommand>()
	const sourceDirectory = join(
		process.cwd(),
		process.env.NODE_ENV === 'production' ? 'dist/src' : 'src',
		'bot',
		'commands'
	)
	const commandFiles = await collectCommandFiles(sourceDirectory)

	for (const file of commandFiles) {
		const module = (await import(pathToFileURL(file).href)) as { default?: BotCommand } & Partial<BotCommand>
		const command = module.default ?? module

		if (!command?.data || !command.execute) {
			throw new Error(`Commande invalide : ${file}`)
		}

		commands.set(command.data.name, command as BotCommand)
	}

	return commands
}
