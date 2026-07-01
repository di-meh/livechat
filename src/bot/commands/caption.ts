import { SlashCommandBuilder, type APIEmbedField, type ChatInputCommandInteraction } from 'discord.js'
import { DEFAULT_LIVECHAT_DURATION_SECONDS } from '../../livechat/constants.js'
import { createCaptionItem } from '../../livechat/items.js'
import { enqueueLiveChatItem } from '../../server/playback.js'
import type { BotCommand } from '../../types/bot.js'
import { createBaseFields, createCommandContext, replyWithLiveChatEmbed } from '../commandHelpers.js'

const command: BotCommand = {
	data: new SlashCommandBuilder()
		.setName('caption')
		.setDescription('Envoie un message sur le livechat')
		.addStringOption((option) =>
			option
				.setName('caption')
				.setDescription('Message à envoyer (128 caractères max.)')
				.setRequired(true)
				.setMaxLength(128)
		)
		.addNumberOption((option) =>
			option
				.setName('maxtime')
				.setDescription("Durée maximale d'affichage du média (optionnel)")
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(30)
		)
		.addBooleanOption((option) =>
			option
				.setName('anon')
				.setDescription('Envoyer le média de manière anonyme (sans nom ni avatar)')
				.setRequired(false)
		)
		.addUserOption((option) =>
			option
				.setName('userto')
				.setDescription("Afficher ce livechat uniquement sur la route de l'utilisateur ciblé")
				.setRequired(false)
		),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const caption = interaction.options.getString('caption', true)
		const maxTime = interaction.options.getNumber('maxtime')
		const context = await createCommandContext(interaction)

		enqueueLiveChatItem(
			createCaptionItem({
				caption,
				maxTime,
				target: context.target,
				user: context.user
			})
		)

		const fields: APIEmbedField[] = [
			...createBaseFields(context.user),
			{ name: 'Message', value: caption },
			{ name: 'Durée max.', value: `${maxTime ?? DEFAULT_LIVECHAT_DURATION_SECONDS} s` }
		]

		await replyWithLiveChatEmbed({
			fields,
			interaction,
			isAnonymous: context.isAnonymous,
			target: context.target,
			targetUser: context.targetUser
		})
	}
}

export default command
