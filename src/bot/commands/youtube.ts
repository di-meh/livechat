import { MessageFlags, SlashCommandBuilder, type APIEmbedField, type ChatInputCommandInteraction } from 'discord.js'
import { createMediaItem, isValidYouTubeUrl } from '../../livechat/items.js'
import { enqueueLiveChatItem } from '../../server/playback.js'
import type { BotCommand } from '../../types/bot.js'
import { createBaseFields, createCommandContext, replyWithLiveChatEmbed } from '../commandHelpers.js'

const command: BotCommand = {
	data: new SlashCommandBuilder()
		.setName('youtube')
		.setDescription('Choisis une vidéo YouTube à envoyer via le livechat')
		.addStringOption((option) => option.setName('url').setDescription("L'URL à envoyer").setRequired(true))
		.addStringOption((option) =>
			option
				.setName('caption')
				.setDescription('Légende à ajouter au média (optionnel)')
				.setRequired(false)
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
		const url = interaction.options.getString('url', true)

		if (!isValidYouTubeUrl(url)) {
			await interaction.reply({
				content: "L'URL fournie n'est pas une URL YouTube valide. Veuillez réessayer.",
				flags: MessageFlags.Ephemeral
			})
			return
		}

		const caption = interaction.options.getString('caption')
		const maxTime = interaction.options.getNumber('maxtime')
		const context = await createCommandContext(interaction)

		enqueueLiveChatItem(
			createMediaItem({
				caption,
				maxTime,
				target: context.target,
				type: 'video/youtube',
				url,
				user: context.user
			})
		)

		const fields: APIEmbedField[] = [
			...createBaseFields(context.user),
			{ name: 'Message', value: caption ?? '' },
			{ name: 'Type de fichier', value: 'video/youtube' },
			{ name: 'URL', value: url },
			{ name: 'Durée max.', value: maxTime ? `${maxTime} s` : 'Durée de la vidéo' }
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
