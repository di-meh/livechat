import { MessageFlags, type APIEmbedField, type CommandInteraction, type InteractionResponse } from 'discord.js'
import { CommandOptions, createCommandConfig } from 'robo.js'
import { createLiveChatReply, createLiveChatUser, getDisplayName } from '../../livechat/discord'
import { createMediaItem, isSupportedAttachmentMediaType } from '../../livechat/items'
import { enqueueLiveChatItem } from '../../livechat/server'

export const config = createCommandConfig({
	timeout: 2000,
	description: 'Choisis un média à envoyer via LiveChat',
	options: [
		{
			name: 'file',
			description: 'Le média à envoyer',
			type: 'attachment',
			required: true
		},
		{
			name: 'caption',
			description: 'Légende à ajouter au média (optionnel)',
			type: 'string',
			required: false,
			max: 128
		},
		{
			name: 'maxtime',
			description: "Nombre de secondes maximum pour l'affichage du média (optionnel)",
			type: 'number',
			required: false,
			min: 1,
			max: 30
		},
		{
			name: 'anon',
			description: 'Envoyer le média de manière anonyme (sans nom + avatar)',
			type: 'boolean',
			required: false
		}
	]
} as const)

export default async (
	interaction: CommandInteraction,
	options: CommandOptions<typeof config>
): Promise<InteractionResponse> => {
	const url = options.file.url as string
	const caption = options.caption as string | undefined
	const type = options.file.contentType
	const maxTime = options.maxtime as number | undefined
	const user = await createLiveChatUser(interaction, options.anon)

	if (!isSupportedAttachmentMediaType(type)) {
		return interaction.reply({
			content: 'Le fichier doit être un fichier audio, image ou vidéo ! Type du fichier envoyé: ' + type,
			flags: MessageFlags.Ephemeral
		})
	}

	enqueueLiveChatItem(
		createMediaItem({
			caption,
			maxTime,
			type,
			url,
			user
		})
	)

	const fields: APIEmbedField[] = [
		{ name: 'Username', value: getDisplayName(user) },
		{ name: 'Message', value: caption ?? '' },
		{ name: 'Type de fichier', value: type },
		{ name: 'URL', value: url },
		{ name: 'Taille du fichier', value: `${options.file.size} bytes` },
		{ name: 'Max Time', value: maxTime ? `${maxTime}sec` : 'La durée du média' }
	]

	return createLiveChatReply({
		fields,
		interaction,
		isAnonymous: options.anon
	})
}
