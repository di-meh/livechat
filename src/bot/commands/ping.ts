import {
	Colors,
	MessageFlags,
	SlashCommandBuilder,
	type ChatInputCommandInteraction,
	type InteractionEditReplyOptions
} from 'discord.js'
import { getLiveChatDiagnostics } from '../../server/channels.js'
import type { BotCommand } from '../../types/bot.js'

function formatBytes(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB']
	let value = bytes
	let unitIndex = 0

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024
		unitIndex += 1
	}

	return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function formatMilliseconds(value: number): string {
	return `${Math.round(value)} ms`
}

function formatDuration(seconds: number): string {
	const days = Math.floor(seconds / 86400)
	const hours = Math.floor((seconds % 86400) / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const remainingSeconds = Math.floor(seconds % 60)

	const parts = [days ? `${days} j` : null, hours ? `${hours} h` : null, minutes ? `${minutes} min` : null, `${remainingSeconds} s`].filter(Boolean)

	return parts.join(' ')
}

function getCpuUsagePercentage(startUsage: NodeJS.CpuUsage, startTime: bigint): string {
	const usage = process.cpuUsage(startUsage)
	const elapsedNanoseconds = Number(process.hrtime.bigint() - startTime)

	if (elapsedNanoseconds <= 0) {
		return '0 %'
	}

	const elapsedMicroseconds = elapsedNanoseconds / 1000
	const cpuMicroseconds = usage.user + usage.system
	const percentage = (cpuMicroseconds / elapsedMicroseconds) * 100

	return `${percentage.toFixed(1)} %`
}

function formatChannelSummary(): string {
	const diagnostics = getLiveChatDiagnostics()

	if (diagnostics.channelSummaries.length === 0) {
		return 'Aucun canal actif'
	}

	return diagnostics.channelSummaries
		.slice(0, 6)
		.map((channel) => {
			const state = channel.hasCurrentItem ? 'lecture en cours' : 'inactif'
			return `${channel.channel} : ${channel.clientCount} client(s), ${channel.queueLength} en attente, ${state}`
		})
		.join('\n')
}

const command: BotCommand = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Affiche l’état du bot et du serveur'),
	execute: async (interaction: ChatInputCommandInteraction) => {
		const cpuStart = process.cpuUsage()
		const timeStart = process.hrtime.bigint()
		const interactionStart = Date.now()

		await interaction.reply({
			content: 'Mesure en cours...',
			flags: MessageFlags.Ephemeral
		})

		const replyLatency = Date.now() - interactionStart
		const wsPing = interaction.client.ws.ping
		const memory = process.memoryUsage()
		const uptime = process.uptime()
		const cpuUsage = getCpuUsagePercentage(cpuStart, timeStart)
		const liveChatDiagnostics = getLiveChatDiagnostics()

		const payload: InteractionEditReplyOptions = {
			content: '',
			embeds: [
				{
					title: 'État du bot',
					color: Colors.Blurple,
					fields: [
						{ name: "Latence de l'interaction", value: formatMilliseconds(replyLatency), inline: true },
						{ name: 'Ping de la gateway', value: formatMilliseconds(wsPing), inline: true },
						{ name: 'CPU du processus', value: cpuUsage, inline: true },
						{ name: 'RSS', value: formatBytes(memory.rss), inline: true },
						{ name: 'Heap utilisée', value: formatBytes(memory.heapUsed), inline: true },
						{ name: 'Heap totale', value: formatBytes(memory.heapTotal), inline: true },
						{ name: 'Uptime du processus', value: formatDuration(uptime), inline: true },
						{ name: 'Node', value: process.version, inline: true },
						{ name: 'Plateforme', value: `${process.platform} ${process.arch}`, inline: true },
						{ name: 'Clients WebSocket', value: `${liveChatDiagnostics.totalClients}`, inline: true },
						{ name: 'Canaux actifs', value: `${liveChatDiagnostics.totalChannels}`, inline: true },
						{ name: 'Lectures en cours', value: `${liveChatDiagnostics.activePlaybackCount}`, inline: true },
						{ name: 'Queue globale', value: `${liveChatDiagnostics.globalQueueLength}`, inline: true },
						{ name: 'Clients du flux global', value: `${liveChatDiagnostics.globalClientCount}`, inline: true },
						{ name: 'Éléments en attente', value: `${liveChatDiagnostics.totalQueuedItems}`, inline: true },
						{ name: 'Résumé des canaux', value: formatChannelSummary() }
					]
				}
			]
		}

		await interaction.editReply(payload)
	}
}

export default command
