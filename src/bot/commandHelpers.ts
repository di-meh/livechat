import type { APIEmbedField, ChatInputCommandInteraction, User } from 'discord.js'
import { createLiveChatReply, createLiveChatUser, getDisplayName } from '../livechat/discord.js'
import type { LiveChatTarget, LiveChatUser } from '../types/livechat.js'

export function getTargetFromUser(user: User | null): LiveChatTarget {
	if (!user) {
		return { kind: 'global' }
	}

	return {
		kind: 'user',
		userId: user.id
	}
}

export async function createCommandContext(interaction: ChatInputCommandInteraction) {
	const isAnonymous = interaction.options.getBoolean('anon')
	const targetUser = interaction.options.getUser('userto')
	const target = getTargetFromUser(targetUser)
	const user = await createLiveChatUser(interaction, isAnonymous)

	return {
		isAnonymous,
		target,
		targetUser,
		user
	}
}

export function createBaseFields(user: LiveChatUser | null): APIEmbedField[] {
	return [{ name: 'Auteur', value: getDisplayName(user) }]
}

export async function replyWithLiveChatEmbed(input: {
	fields: APIEmbedField[]
	interaction: ChatInputCommandInteraction
	isAnonymous: boolean | null
	target: LiveChatTarget
	targetUser: User | null
}) {
	return createLiveChatReply(input)
}
