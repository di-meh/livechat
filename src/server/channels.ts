import type { WebSocket } from 'ws'
import type { LiveChatChannelKey, LiveChatItem, LiveChatQueue, LiveChatStateSnapshot } from '../types/livechat.js'

type ChannelState = {
	channel: LiveChatChannelKey
	clients: Set<WebSocket>
	currentItem: LiveChatItem | null
	queue: LiveChatQueue
	timeout: NodeJS.Timeout | null
}

const channels = new Map<LiveChatChannelKey, ChannelState>()

export type LiveChatDiagnostics = {
	totalChannels: number
	totalClients: number
	totalQueuedItems: number
	activePlaybackCount: number
	globalQueueLength: number
	globalClientCount: number
	channelSummaries: Array<{
		channel: LiveChatChannelKey
		clientCount: number
		queueLength: number
		hasCurrentItem: boolean
	}>
}

export function getOrCreateChannel(channel: LiveChatChannelKey): ChannelState {
	const existing = channels.get(channel)

	if (existing) {
		return existing
	}

	const state: ChannelState = {
		channel,
		clients: new Set(),
		currentItem: null,
		queue: [],
		timeout: null
	}

	channels.set(channel, state)
	return state
}

export function getChannelSnapshot(channel: LiveChatChannelKey): LiveChatStateSnapshot {
	const state = getOrCreateChannel(channel)

	return {
		channel,
		currentItem: state.currentItem,
		queue: [...state.queue],
		queueLength: state.queue.length
	}
}

export function attachClient(channel: LiveChatChannelKey, socket: WebSocket): void {
	getOrCreateChannel(channel).clients.add(socket)
}

export function detachClient(channel: LiveChatChannelKey, socket: WebSocket): void {
	getOrCreateChannel(channel).clients.delete(socket)
}

export function getChannelClients(channel: LiveChatChannelKey): Set<WebSocket> {
	return getOrCreateChannel(channel).clients
}

export function getCurrentItem(channel: LiveChatChannelKey): LiveChatItem | null {
	return getOrCreateChannel(channel).currentItem
}

export function setCurrentItem(channel: LiveChatChannelKey, item: LiveChatItem | null): void {
	getOrCreateChannel(channel).currentItem = item
}

export function enqueueItem(channel: LiveChatChannelKey, item: LiveChatItem): number {
	const state = getOrCreateChannel(channel)
	state.queue.push(item)
	return state.queue.length
}

export function shiftNextItem(channel: LiveChatChannelKey): LiveChatItem | null {
	const state = getOrCreateChannel(channel)
	return state.queue.shift() ?? null
}

export function clearChannelTimeout(channel: LiveChatChannelKey): void {
	const state = getOrCreateChannel(channel)

	if (state.timeout) {
		clearTimeout(state.timeout)
		state.timeout = null
	}
}

export function setChannelTimeout(channel: LiveChatChannelKey, timeout: NodeJS.Timeout | null): void {
	clearChannelTimeout(channel)
	getOrCreateChannel(channel).timeout = timeout
}

export function getLiveChatDiagnostics(): LiveChatDiagnostics {
	const channelSummaries = [...channels.values()].map((channel) => ({
		channel: channel.channel,
		clientCount: channel.clients.size,
		queueLength: channel.queue.length,
		hasCurrentItem: channel.currentItem !== null
	}))

	const totalClients = channelSummaries.reduce((sum, channel) => sum + channel.clientCount, 0)
	const totalQueuedItems = channelSummaries.reduce((sum, channel) => sum + channel.queueLength, 0)
	const activePlaybackCount = channelSummaries.reduce((sum, channel) => sum + (channel.hasCurrentItem ? 1 : 0), 0)
	const globalSummary = channelSummaries.find((channel) => channel.channel === 'global')

	return {
		totalChannels: channelSummaries.length,
		totalClients,
		totalQueuedItems,
		activePlaybackCount,
		globalQueueLength: globalSummary?.queueLength ?? 0,
		globalClientCount: globalSummary?.clientCount ?? 0,
		channelSummaries
	}
}
