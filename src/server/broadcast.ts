import { WebSocket } from 'ws'
import type { LiveChatChannelKey, LiveChatItem } from '../types/livechat.js'
import { getChannelClients, getChannelSnapshot } from './channels.js'
import type { ServerMessage } from './protocol.js'

function send(socket: WebSocket, message: ServerMessage): void {
	if (socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify(message))
	}
}

export function sendState(socket: WebSocket, channel: LiveChatChannelKey, type: 'hello' | 'state' = 'state'): void {
	send(socket, {
		type,
		state: getChannelSnapshot(channel)
	})
}

export function broadcastState(channel: LiveChatChannelKey): void {
	const state = getChannelSnapshot(channel)
	const message: ServerMessage = {
		type: 'state',
		state
	}

	for (const client of getChannelClients(channel)) {
		send(client, message)
	}
}

export function broadcastPlay(channel: LiveChatChannelKey, item: LiveChatItem): void {
	const message: ServerMessage = {
		type: 'play',
		item,
		state: getChannelSnapshot(channel)
	}

	for (const client of getChannelClients(channel)) {
		send(client, message)
	}
}

export function broadcastClear(channel: LiveChatChannelKey, itemId: string | null): void {
	const message: ServerMessage = {
		type: 'clear',
		itemId,
		state: getChannelSnapshot(channel)
	}

	for (const client of getChannelClients(channel)) {
		send(client, message)
	}
}
