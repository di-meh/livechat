import { Colors, MessageFlags, type APIEmbedField, type CommandInteraction, type InteractionResponse } from 'discord.js'
import type { LiveChatUser } from '../types/livechat'

export async function createLiveChatUser(
	interaction: CommandInteraction,
	isAnonymous: boolean | undefined
): Promise<LiveChatUser | null> {
	if (isAnonymous) {
		return null
	}

	const guildUser = await interaction.guild?.members.fetch(interaction.user)
	const displayName = guildUser?.displayName ?? interaction.user.username

	return {
		name: displayName,
		avatar: interaction.user.displayAvatarURL({ size: 256 })
	}
}

export function getDisplayName(user: LiveChatUser | null): string {
	return user?.name ?? 'Personne tkt'
}

export function createLiveChatReply(input: {
	fields: APIEmbedField[]
	interaction: CommandInteraction
	isAnonymous: boolean | undefined
}): Promise<InteractionResponse> {
	return input.interaction.reply({
		embeds: [
			{
				title: 'Livechat envoyé !',
				color: Colors.Green,
				thumbnail: input.isAnonymous
					? undefined
					: {
							url: input.interaction.user.displayAvatarURL({ size: 256 })
						},
				fields: input.fields
			}
		],
		flags: MessageFlags.Ephemeral
	})
}
