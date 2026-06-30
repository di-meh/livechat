import type { APIEmbedField, CommandInteraction, InteractionResponse } from 'discord.js'
import { CommandOptions, createCommandConfig } from 'robo.js'
import { DEFAULT_LIVECHAT_DURATION_SECONDS } from '../../livechat/constants'
import { createLiveChatReply, createLiveChatUser, getDisplayName } from '../../livechat/discord'
import { createCaptionItem } from '../../livechat/items'
import { enqueueLiveChatItem } from '../../livechat/server'

export const config = createCommandConfig({
	timeout: 2000,
	description: 'Envoie un message sur le livechat',
	options: [
		{
			name: 'caption',
			description: 'Message à envoyer (128 caractères max)',
			type: 'string',
			required: true,
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
	const caption = options.caption as string
	const maxTime = options.maxtime as number | undefined
	const user = await createLiveChatUser(interaction, options.anon)

	enqueueLiveChatItem(
		createCaptionItem({
			caption,
			maxTime,
			user
		})
	)

	const fields: APIEmbedField[] = [
		{ name: 'Username', value: getDisplayName(user) },
		{ name: 'Message', value: caption },
		{ name: 'Max Time', value: `${maxTime ?? DEFAULT_LIVECHAT_DURATION_SECONDS}sec` }
	]

	return createLiveChatReply({
		fields,
		interaction,
		isAnonymous: options.anon
	})
}
