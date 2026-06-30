import { MessagePayload, SyncServer } from '@robojs/sync/server.js'
import { logger } from 'robo.js'
import type { WebSocketServer } from 'ws'
import { LIVECHAT_SYNC_KEY } from '../livechat/constants'
import { setLiveChatQueue } from '../livechat/server'
import type { LiveChatQueue } from '../types/livechat'

export default () => {
	const socketServer = SyncServer.getSocketServer() as WebSocketServer | undefined

	socketServer?.on('connection', (socket) => {
		logger.info('Listening to client messages')

		socket.on('message', (message) => {
			const payload = JSON.parse(message.toString()) as MessagePayload<LiveChatQueue>
			const isLiveChatUpdate =
				payload.type === 'update' &&
				Array.isArray(payload.key) &&
				payload.key.length === LIVECHAT_SYNC_KEY.length &&
				payload.key.every((part, index) => part === LIVECHAT_SYNC_KEY[index])

			if (isLiveChatUpdate) {
				setLiveChatQueue(payload.data)
			}

			logger.info('Message incoming du client au serveur:', message.toString())
		})
	})
}
