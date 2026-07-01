import { SlashCommandBuilder, type APIEmbedField, type ChatInputCommandInteraction } from 'discord.js'
import { getChannelKey } from '../../livechat/items.js'
import { advanceChannel, getChannelState } from '../../server/playback.js'
import type { BotCommand } from '../../types/bot.js'
import { createCommandContext, replyWithLiveChatEmbed } from '../commandHelpers.js'

const command: BotCommand = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Passe immédiatement au média suivant')
		.addUserOption((option) =>
			option
				.setName('userto')
				.setDescription("Passer au média suivant uniquement pour l'utilisateur ciblé")
				.setRequired(false)
		),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const context = await createCommandContext(interaction)
		const stateBefore = getChannelState(context.target)
		const hadCurrentItem = stateBefore.currentItem !== null

		advanceChannel(getChannelKey(context.target))

		const stateAfter = getChannelState(context.target)
		const fields: APIEmbedField[] = [
			{ name: 'Média en cours ignoré', value: hadCurrentItem ? 'Oui' : 'Non' },
			{ name: 'Éléments restants dans la file', value: String(stateAfter.queueLength) }
		]

		await replyWithLiveChatEmbed({
			fields,
			interaction,
			isAnonymous: null,
			target: context.target,
			targetUser: context.targetUser,
			title: 'Média suivant lancé !'
		})
	}
}

export default command
