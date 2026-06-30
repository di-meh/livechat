import { MessagePayload, SyncServer } from '@robojs/sync/server.js'
import { getState, setState } from 'robo.js'
import type { WebSocketServer } from 'ws'
import { LIVECHAT_STATE_KEY, LIVECHAT_SYNC_KEY } from './constants'
import type { LiveChatData, LiveChatQueue } from '../types/livechat'

export function getLiveChatQueue(): LiveChatQueue {
	return getState<LiveChatQueue>(LIVECHAT_STATE_KEY) ?? []
}

export function setLiveChatQueue(queue: LiveChatQueue): LiveChatQueue {
	setState(LIVECHAT_STATE_KEY, queue)
	return queue
}

export function createLiveChatPayload(queue: LiveChatQueue): MessagePayload<LiveChatQueue> {
	return {
		data: queue,
		type: 'update',
		key: [...LIVECHAT_SYNC_KEY]
	}
}

export function broadcastLiveChatQueue(queue: LiveChatQueue): void {
	const socketServer = SyncServer.getSocketServer() as WebSocketServer | undefined

	if (!socketServer) {
		return
	}

	const payload = JSON.stringify(createLiveChatPayload(queue))
	socketServer.clients.forEach((client) => {
		client.send(payload)
	})
}

export function enqueueLiveChatItem(item: LiveChatData): LiveChatQueue {
	const nextQueue = [...getLiveChatQueue(), item]
	setLiveChatQueue(nextQueue)
	broadcastLiveChatQueue(nextQueue)
	return nextQueue
}
