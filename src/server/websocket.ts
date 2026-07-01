import type { Server as HttpServer } from 'node:http'
import { WebSocket, WebSocketServer } from 'ws'
import type { LiveChatChannelKey } from '../types/livechat.js'
import { attachClient, detachClient } from './channels.js'
import { sendState } from './broadcast.js'
import { advanceChannel } from './playback.js'
import { isLiveChatChannelKey, parseClientMessage } from './protocol.js'

let websocketServer: WebSocketServer | null = null
const HEARTBEAT_INTERVAL_MS = 15000

type LiveChatSocket = WebSocket & {
	isAlive?: boolean
	channel?: LiveChatChannelKey
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
			socket.send(
				JSON.stringify({
					type: 'pong',
					serverTime: Date.now()
				})
			)
		}
	})

	socket.on('close', () => {
		detachClient(channel, socket)
	})

	socket.on('error', () => {
		detachClient(channel, socket)
	})
}

function resolveChannel(url: URL): LiveChatChannelKey | null {
	const channel = url.searchParams.get('channel')

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
		const url = new URL(request.url ?? '/', 'http://localhost')

		if (url.pathname !== '/ws') {
			socket.destroy()
			return
		}

		const channel = resolveChannel(url)

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
