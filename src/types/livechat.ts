export type LiveChatUser = {
	name: string
	avatar: string
}

export type SupportedAttachmentMediaType = `audio/${string}` | `image/${string}` | `video/${string}`

export type LiveChatMediaType = SupportedAttachmentMediaType | 'video/youtube'

type LiveChatBase = {
	user: LiveChatUser | null
	maxTime: number | null
}

export type LiveChatMediaItem = LiveChatBase & {
	kind: 'media'
	type: LiveChatMediaType
	url: string
	caption: string | null
}

export type LiveChatCaptionItem = LiveChatBase & {
	kind: 'caption'
	type: null
	url: null
	caption: string
}

export type LiveChatData = LiveChatMediaItem | LiveChatCaptionItem

export type LiveChatQueue = LiveChatData[]
