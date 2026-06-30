import { MessageFlags, type APIEmbedField, type CommandInteraction, type InteractionResponse } from 'discord.js'
import { CommandOptions, createCommandConfig } from 'robo.js'
import { createLiveChatReply, createLiveChatUser, getDisplayName } from '../../livechat/discord'
import { createMediaItem, isValidYouTubeUrl } from '../../livechat/items'
import { enqueueLiveChatItem } from '../../livechat/server'

export const config = createCommandConfig({
	timeout: 2000,
	description: 'Choisis une vidéo YouTube a envoyer via LiveChat',
	options: [
		{
			name: 'url',
			description: "L'url à envoyer",
			type: 'string',
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
	const url = options.url as string

	if (!isValidYouTubeUrl(url)) {
		return interaction.reply({
			content: "L'URL fournie n'est pas une URL YouTube valide. Veuillez réessayer.",
			flags: MessageFlags.Ephemeral
		})
	}

	const caption = options.caption as string | undefined
	const maxTime = options.maxtime as number | undefined
	const user = await createLiveChatUser(interaction, options.anon)

	enqueueLiveChatItem(
		createMediaItem({
			caption,
			maxTime,
			type: 'video/youtube',
			url,
			user
		})
	)

	const fields: APIEmbedField[] = [
		{ name: 'Username', value: getDisplayName(user) },
		{ name: 'Message', value: caption ?? '' },
		{ name: 'Type de fichier', value: 'video/youtube' },
		{ name: 'URL', value: url },
		{ name: 'Max Time', value: maxTime ? `${maxTime}sec` : 'La durée de la vidéo' }
	]

	return createLiveChatReply({
		fields,
		interaction,
		isAnonymous: options.anon
	})
}
