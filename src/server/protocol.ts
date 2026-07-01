import type { LiveChatChannelKey, LiveChatItem, LiveChatStateSnapshot } from '../types/livechat.js'

export type ClientMessage =
	| {
			type: 'ready'
			lastKnownItemId?: string | null
	  }
	| {
			type: 'media-ended'
			itemId: string
	  }
	| {
			type: 'ping'
	  }

export type ServerMessage =
	| {
			type: 'hello'
			state: LiveChatStateSnapshot
	  }
	| {
			type: 'state'
			state: LiveChatStateSnapshot
	  }
	| {
			type: 'play'
			item: LiveChatItem
			state: LiveChatStateSnapshot
	  }
	| {
			type: 'clear'
			itemId: string | null
			state: LiveChatStateSnapshot
	  }
	| {
			type: 'pong'
			serverTime: number
	  }

export function isLiveChatChannelKey(value: string | null): value is LiveChatChannelKey {
	if (!value) {
		return false
	}

	return value === 'global' || value.startsWith('user:')
}

export function parseClientMessage(raw: string): ClientMessage | null {
	try {
		const payload = JSON.parse(raw) as Partial<ClientMessage> | null

		if (!payload || typeof payload !== 'object' || typeof payload.type !== 'string') {
			return null
		}

		if (payload.type === 'ready') {
			return {
				type: 'ready',
				lastKnownItemId: typeof payload.lastKnownItemId === 'string' || payload.lastKnownItemId === null ? payload.lastKnownItemId : undefined
			}
		}

		if (payload.type === 'media-ended' && typeof payload.itemId === 'string') {
			return {
				type: 'media-ended',
				itemId: payload.itemId
			}
		}

		if (payload.type === 'ping') {
			return { type: 'ping' }
		}

		return null
	} catch {
		return null
	}
}
