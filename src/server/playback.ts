import { getDisplayDurationMilliseconds, getChannelKey, shouldAutoAdvance } from '../livechat/items.js'
import type { LiveChatChannelKey, LiveChatItem, LiveChatTarget } from '../types/livechat.js'
import {
	clearChannelTimeout,
	enqueueItem,
	getChannelSnapshot,
	getCurrentItem,
	setChannelTimeout,
	setCurrentItem,
	shiftNextItem
} from './channels.js'
import { broadcastClear, broadcastPlay, broadcastState } from './websocket.js'

function startCurrentItem(channel: LiveChatChannelKey, item: LiveChatItem): void {
	setCurrentItem(channel, item)
	broadcastPlay(channel, item)
	broadcastState(channel)

	if (!shouldAutoAdvance(item)) {
		return
	}

	const timeout = setTimeout(() => {
		advanceChannel(channel, item.id)
	}, getDisplayDurationMilliseconds(item))

	setChannelTimeout(channel, timeout)
}

function startNextItem(channel: LiveChatChannelKey): void {
	clearChannelTimeout(channel)
	const nextItem = shiftNextItem(channel)

	if (!nextItem) {
		setCurrentItem(channel, null)
		broadcastClear(channel, null)
		broadcastState(channel)
		return
	}

	startCurrentItem(channel, nextItem)
}

export function enqueueLiveChatItem(item: LiveChatItem): void {
	const channel = getChannelKey(item.target)
	enqueueItem(channel, item)
	broadcastState(channel)

	if (!getCurrentItem(channel)) {
		startNextItem(channel)
	}
}

export function advanceChannel(channel: LiveChatChannelKey, expectedItemId?: string): void {
	const currentItem = getCurrentItem(channel)

	if (!currentItem) {
		broadcastState(channel)
		return
	}

	if (expectedItemId && currentItem.id !== expectedItemId) {
		return
	}

	clearChannelTimeout(channel)
	setCurrentItem(channel, null)
	broadcastClear(channel, currentItem.id)
	broadcastState(channel)
	startNextItem(channel)
}

export function getChannelState(target: LiveChatTarget) {
	return getChannelSnapshot(getChannelKey(target))
}
