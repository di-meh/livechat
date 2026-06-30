import { DEFAULT_LIVECHAT_DURATION_SECONDS } from './constants'
import type {
	LiveChatCaptionItem,
	LiveChatData,
	LiveChatMediaItem,
	LiveChatMediaType,
	LiveChatUser,
	SupportedAttachmentMediaType
} from '../types/livechat'

export function createCaptionItem(input: {
	caption: string
	maxTime?: number | null
	user: LiveChatUser | null
}): LiveChatCaptionItem {
	return {
		kind: 'caption',
		type: null,
		url: null,
		caption: input.caption,
		maxTime: input.maxTime ?? null,
		user: input.user
	}
}

export function createMediaItem(input: {
	caption?: string | null
	maxTime?: number | null
	type: LiveChatMediaType
	url: string
	user: LiveChatUser | null
}): LiveChatMediaItem {
	return {
		kind: 'media',
		type: input.type,
		url: input.url,
		caption: input.caption ?? null,
		maxTime: input.maxTime ?? null,
		user: input.user
	}
}

export function isCaptionItem(item: LiveChatData): item is LiveChatCaptionItem {
	return item.kind === 'caption'
}

export function isMediaItem(item: LiveChatData): item is LiveChatMediaItem {
	return item.kind === 'media'
}

export function isImageItem(item: LiveChatData): boolean {
	return isMediaItem(item) && item.type.startsWith('image/')
}

export function isPlayableMediaItem(item: LiveChatData): boolean {
	if (!isMediaItem(item)) {
		return false
	}

	return item.type.startsWith('audio/') || item.type.startsWith('video/')
}

export function shouldAutoAdvance(item: LiveChatData): boolean {
	return isCaptionItem(item) || isImageItem(item) || item.maxTime !== null
}

export function getDisplayDurationMilliseconds(item: LiveChatData): number {
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
