export type LiveChatUser = {
	name: string
	avatar: string
}

export type SupportedAttachmentMediaType = `audio/${string}` | `image/${string}` | `video/${string}`

export type LiveChatMediaType = SupportedAttachmentMediaType | 'video/youtube'

export type LiveChatTarget =
	| {
			kind: 'global'
	  }
	| {
			kind: 'user'
			userId: string
	  }

type LiveChatBase = {
	id: string
	user: LiveChatUser | null
	maxTime: number | null
	target: LiveChatTarget
	createdAt: string
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

export type LiveChatItem = LiveChatMediaItem | LiveChatCaptionItem

export type LiveChatQueue = LiveChatItem[]

export type LiveChatChannelKey = 'global' | `user:${string}`

export type LiveChatStateSnapshot = {
	channel: LiveChatChannelKey
	currentItem: LiveChatItem | null
	queueLength: number
	queue: LiveChatQueue
}
