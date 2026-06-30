import { useSyncState } from '@robojs/sync'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LIVECHAT_SYNC_KEY } from '../../livechat/constants'
import { getDisplayDurationMilliseconds, shouldAutoAdvance } from '../../livechat/items'
import type { LiveChatData, LiveChatQueue } from '../../types/livechat'

export function useLiveChatPlayback() {
	const [queue, setQueue] = useSyncState<LiveChatQueue>([], [...LIVECHAT_SYNC_KEY])
	const [currentItem, setCurrentItem] = useState<LiveChatData | null>(null)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)
	const isProcessingRef = useRef(false)

	const clearPlaybackTimeout = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
	}, [])

	const processNext = useCallback(() => {
		if (isProcessingRef.current) {
			return
		}

		setQueue((previousQueue) => {
			if (previousQueue.length === 0) {
				setCurrentItem(null)
				isProcessingRef.current = false
				return previousQueue
			}

			const [nextItem, ...remainingQueue] = previousQueue
			setCurrentItem(nextItem)
			isProcessingRef.current = true
			return remainingQueue
		})
	}, [setQueue])

	const advance = useCallback(() => {
		isProcessingRef.current = false
		processNext()
	}, [processNext])

	useEffect(() => {
		if (!isProcessingRef.current && queue.length > 0) {
			processNext()
		}
	}, [processNext, queue])

	useEffect(() => {
		clearPlaybackTimeout()

		if (!currentItem || !isProcessingRef.current || !shouldAutoAdvance(currentItem)) {
			return clearPlaybackTimeout
		}

		timeoutRef.current = setTimeout(() => {
			advance()
		}, getDisplayDurationMilliseconds(currentItem))

		return clearPlaybackTimeout
	}, [advance, clearPlaybackTimeout, currentItem])

	useEffect(() => clearPlaybackTimeout, [clearPlaybackTimeout])

	return {
		currentItem,
		hasQueueItems: queue.length > 0,
		handleMediaEnded: advance
	}
}
