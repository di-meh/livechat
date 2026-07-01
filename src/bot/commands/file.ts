import { MessageFlags, SlashCommandBuilder, type APIEmbedField, type ChatInputCommandInteraction } from 'discord.js'
import { createMediaItem, isSupportedAttachmentMediaType } from '../../livechat/items.js'
import { enqueueLiveChatItem } from '../../server/playback.js'
import type { BotCommand } from '../../types/bot.js'
import { createBaseFields, createCommandContext, replyWithLiveChatEmbed } from '../commandHelpers.js'

const command: BotCommand = {
	data: new SlashCommandBuilder()
		.setName('file')
		.setDescription('Choisis un média à envoyer via le livechat')
		.addAttachmentOption((option) => option.setName('file').setDescription('Le média à envoyer').setRequired(true))
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
		const attachment = interaction.options.getAttachment('file', true)
		const type = attachment.contentType

		if (!isSupportedAttachmentMediaType(type)) {
			await interaction.reply({
				content: 'Le fichier doit être de type audio, image ou vidéo. Type reçu : ' + type,
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
				type,
				url: attachment.url,
				user: context.user
			})
		)

		const fields: APIEmbedField[] = [
			...createBaseFields(context.user),
			{ name: 'Message', value: caption ?? '' },
			{ name: 'Type de fichier', value: type },
			{ name: 'URL', value: attachment.url },
			{ name: 'Taille du fichier', value: `${attachment.size} octets` },
			{ name: 'Durée max.', value: maxTime ? `${maxTime} s` : 'Durée du média' }
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
