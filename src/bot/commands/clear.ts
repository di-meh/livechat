import { SlashCommandBuilder, type APIEmbedField, type ChatInputCommandInteraction } from 'discord.js'
import { clearLiveChatChannel } from '../../server/playback.js'
import type { BotCommand } from '../../types/bot.js'
import { createCommandContext, replyWithLiveChatEmbed } from '../commandHelpers.js'

const command: BotCommand = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Vide la file livechat et stoppe le média en cours')
		.addUserOption((option) =>
			option
				.setName('userto')
				.setDescription("Vider uniquement la file de l'utilisateur ciblé")
				.setRequired(false)
		),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const context = await createCommandContext(interaction)
		const result = clearLiveChatChannel(context.target)

		const fields: APIEmbedField[] = [
			{ name: 'Média en cours stoppé', value: result.clearedCurrentItem ? 'Oui' : 'Non' },
			{ name: 'Éléments retirés de la file', value: String(result.clearedQueuedItems) }
		]

		await replyWithLiveChatEmbed({
			fields,
			interaction,
			isAnonymous: null,
			target: context.target,
			targetUser: context.targetUser,
			title: 'File livechat vidée !'
		})
	}
}

export default command
