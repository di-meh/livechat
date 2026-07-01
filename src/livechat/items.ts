import { randomUUID } from 'node:crypto'
import { DEFAULT_LIVECHAT_DURATION_SECONDS } from './constants.js'
import type {
	LiveChatCaptionItem,
	LiveChatChannelKey,
	LiveChatItem,
	LiveChatMediaItem,
	LiveChatMediaType,
	LiveChatTarget,
	LiveChatUser,
	SupportedAttachmentMediaType
} from '../types/livechat.js'

function createBaseItem(input: {
	maxTime?: number | null
	target: LiveChatTarget
	user: LiveChatUser | null
}) {
	return {
		id: randomUUID(),
		createdAt: new Date().toISOString(),
		maxTime: input.maxTime ?? null,
		target: input.target,
		user: input.user
	}
}

export function createCaptionItem(input: {
	caption: string
	maxTime?: number | null
	target: LiveChatTarget
	user: LiveChatUser | null
}): LiveChatCaptionItem {
	return {
		...createBaseItem(input),
		kind: 'caption',
		type: null,
		url: null,
		caption: input.caption
	}
}

export function createMediaItem(input: {
	caption?: string | null
	maxTime?: number | null
	target: LiveChatTarget
	type: LiveChatMediaType
	url: string
	user: LiveChatUser | null
}): LiveChatMediaItem {
	return {
		...createBaseItem(input),
		kind: 'media',
		type: input.type,
		url: input.url,
		caption: input.caption ?? null
	}
}

export function getChannelKey(target: LiveChatTarget): LiveChatChannelKey {
	if (target.kind === 'global') {
		return 'global'
	}

	return `user:${target.userId}`
}

export function isCaptionItem(item: LiveChatItem): item is LiveChatCaptionItem {
	return item.kind === 'caption'
}

export function isMediaItem(item: LiveChatItem): item is LiveChatMediaItem {
	return item.kind === 'media'
}

export function isImageItem(item: LiveChatItem): boolean {
	return isMediaItem(item) && item.type.startsWith('image/')
}

export function isPlayableMediaItem(item: LiveChatItem): boolean {
	if (!isMediaItem(item)) {
		return false
	}

	return item.type.startsWith('audio/') || item.type.startsWith('video/')
}

export function shouldAutoAdvance(item: LiveChatItem): boolean {
	return isCaptionItem(item) || isImageItem(item) || item.maxTime !== null
}

export function getDisplayDurationMilliseconds(item: LiveChatItem): number {
	return (item.maxTime ?? DEFAULT_LIVECHAT_DURATION_SECONDS) * 1000
}

export function isSupportedAttachmentMediaType(type: string | null | undefined): type is SupportedAttachmentMediaType {
	if (!type) {
		return false
	}

	return type.startsWith('audio/') || type.startsWith('image/') || type.startsWith('video/')
}

export function isValidYouTubeUrl(url: string): boolean {
	const videoIdRegex =
		/(?:youtu\.be|youtube|youtube\.com|youtube-nocookie\.com)(?:\/shorts)?\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|)((?:\w|-){11})/

	return videoIdRegex.test(url)
}
