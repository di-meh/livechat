import type { ChatInputCommandInteraction } from 'discord.js'
import type { BotCommand, BotEvent } from '../../types/bot.js'

let commands: Map<string, BotCommand> = new Map()

export function setInteractionCommands(nextCommands: Map<string, BotCommand>): void {
	commands = nextCommands
}

async function handleChatInputCommand(interaction: ChatInputCommandInteraction): Promise<void> {
	const command = commands.get(interaction.commandName)

	if (!command) {
		if (!interaction.replied && !interaction.deferred) {
			await interaction.reply({
				content: 'Commande introuvable.',
				ephemeral: true
			})
		}
		return
	}

	await command.execute(interaction)
}

const interactionCreateEvent: BotEvent<'interactionCreate'> = {
	name: 'interactionCreate',
	execute: async (interaction: Parameters<BotEvent<'interactionCreate'>['execute']>[0]) => {
		if (!interaction.isChatInputCommand()) {
			return
		}

		try {
			await handleChatInputCommand(interaction)
		} catch (error) {
			console.error("Erreur pendant l'exécution de la commande Discord", error)

			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: 'Une erreur est survenue pendant le traitement de la commande.',
					ephemeral: true
				})
			} else {
				await interaction.followUp({
					content: 'Une erreur est survenue pendant le traitement de la commande.',
					ephemeral: true
				})
			}
		}
	}
}

export default interactionCreateEvent
