import type { IncomingMessage, Server as HttpServer } from 'node:http'
import { parse } from 'node:url'
import { WebSocket, WebSocketServer } from 'ws'
import type { LiveChatChannelKey, LiveChatItem } from '../types/livechat.js'
import { attachClient, detachClient, getChannelClients, getChannelSnapshot } from './channels.js'
import { advanceChannel } from './playback.js'
import { isLiveChatChannelKey, parseClientMessage, type ServerMessage } from './protocol.js'

let websocketServer: WebSocketServer | null = null
const HEARTBEAT_INTERVAL_MS = 15000

type LiveChatSocket = WebSocket & {
	isAlive?: boolean
	channel?: LiveChatChannelKey
}

function send(socket: WebSocket, message: ServerMessage): void {
	if (socket.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify(message))
	}
}

function sendState(socket: WebSocket, channel: LiveChatChannelKey, type: 'hello' | 'state' = 'state'): void {
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


function setupHeartbeat(wss: WebSocketServer): void {
	setInterval(() => {
		for (const rawSocket of wss.clients) {
			const socket = rawSocket as LiveChatSocket

			if (socket.isAlive === false) {
				socket.terminate()
				continue
			}

			socket.isAlive = false
			socket.ping()
		}
	}, HEARTBEAT_INTERVAL_MS).unref()
}

function handleSocketConnection(channel: LiveChatChannelKey, socket: WebSocket): void {
	const liveChatSocket = socket as LiveChatSocket
	liveChatSocket.isAlive = true
	liveChatSocket.channel = channel
	liveChatSocket.on('pong', () => {
		liveChatSocket.isAlive = true
	})

	attachClient(channel, socket)
	sendState(socket, channel, 'hello')

	socket.on('message', (rawMessage) => {
		liveChatSocket.isAlive = true
		const message = parseClientMessage(rawMessage.toString())

		if (!message) {
			return
		}

		if (message.type === 'ready') {
			sendState(socket, channel)
			return
		}

		if (message.type === 'media-ended') {
			advanceChannel(channel, message.itemId)
			return
		}

		if (message.type === 'ping') {
			send(socket, {
				type: 'pong',
				serverTime: Date.now()
			})
		}
	})

	socket.on('close', () => {
		detachClient(channel, socket)
	})

	socket.on('error', () => {
		detachClient(channel, socket)
	})
}

function resolveChannel(request: IncomingMessage): LiveChatChannelKey | null {
	const url = request.url ? parse(request.url, true) : null
	const channel = typeof url?.query.channel === 'string' ? url.query.channel : null

	if (!isLiveChatChannelKey(channel)) {
		return null
	}

	return channel
}

export function attachWebSocketServer(server: HttpServer): WebSocketServer {
	const wss = new WebSocketServer({ noServer: true })
	websocketServer = wss
	setupHeartbeat(wss)

	server.on('upgrade', (request, socket, head) => {
		const { pathname } = new URL(request.url ?? '/', 'http://localhost')

		if (pathname !== '/ws') {
			socket.destroy()
			return
		}

		const channel = resolveChannel(request)

		if (!channel) {
			socket.destroy()
			return
		}

		wss.handleUpgrade(request, socket, head, (upgradedSocket) => {
			handleSocketConnection(channel, upgradedSocket)
		})
	})

	return wss
}

export function getWebSocketServer(): WebSocketServer | null {
	return websocketServer
}
