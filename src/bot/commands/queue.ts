import { SlashCommandBuilder, type APIEmbedField, type ChatInputCommandInteraction } from 'discord.js'
import type { LiveChatItem } from '../../types/livechat.js'
import { getChannelState } from '../../server/playback.js'
import type { BotCommand } from '../../types/bot.js'
import { createCommandContext, replyWithLiveChatEmbed } from '../commandHelpers.js'

function formatItemAge(createdAt: string): string {
	const ageMilliseconds = Date.now() - new Date(createdAt).getTime()

	if (ageMilliseconds < 60_000) {
		return `${Math.max(0, Math.floor(ageMilliseconds / 1000))} s`
	}

	if (ageMilliseconds < 3_600_000) {
		return `${Math.floor(ageMilliseconds / 60_000)} min`
	}

	return `${Math.floor(ageMilliseconds / 3_600_000)} h`
}

function formatItem(item: LiveChatItem): string {
	const author = item.user?.name ?? 'Anonyme'
	const caption = item.caption ? ` - ${item.caption}` : ''
	const maxTime = item.maxTime !== null ? ` - max ${item.maxTime}s` : ''
	const age = ` - il y a ${formatItemAge(item.createdAt)}`

	if (item.kind === 'caption') {
		return `Caption par ${author}${caption}${maxTime}${age}`
	}

	return `${item.type} par ${author}${caption}${maxTime}${age}`
}

function formatUpcomingItems(items: LiveChatItem[]): string {
	if (items.length === 0) {
		return 'Aucun élément en attente'
	}

	const preview = items.slice(0, 5).map((item, index) => `${index + 1}. ${formatItem(item)}`)

	if (items.length > 5) {
		preview.push(`... et ${items.length - 5} autre(s)`)
	}

	return preview.join('\n')
}

const command: BotCommand = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Affiche l’état de la file livechat')
		.addUserOption((option) =>
			option
				.setName('userto')
				.setDescription("Afficher uniquement la file de l'utilisateur ciblé")
				.setRequired(false)
		),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const context = await createCommandContext(interaction)
		const state = getChannelState(context.target)

		const fields: APIEmbedField[] = [
			{ name: 'Canal', value: state.channel, inline: true },
			{ name: 'Éléments en attente', value: String(state.queueLength), inline: true },
			{
				name: 'Média en cours',
				value: state.currentItem ? formatItem(state.currentItem) : 'Aucun média en cours'
			},
			{ name: 'Prochains éléments', value: formatUpcomingItems(state.queue) }
		]

		await replyWithLiveChatEmbed({
			fields,
			interaction,
			isAnonymous: null,
			target: context.target,
			targetUser: context.targetUser,
			title: 'État de la file livechat'
		})
	}
}

export default command
