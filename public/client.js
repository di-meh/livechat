const identityElement = document.getElementById('identity')
const identityAvatarElement = document.getElementById('identity-avatar')
const identityNameElement = document.getElementById('identity-name')
const captionElement = document.getElementById('caption')
const mediaShellElement = document.getElementById('media-shell')

let socket = null
let currentItemId = null
let activePlayer = null
let reconnectAttempts = 0
let reconnectTimeoutId = null
let heartbeatIntervalId = null

const MIN_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 10000
const HEARTBEAT_INTERVAL_MS = 15000

function clearReconnectTimer() {
	if (reconnectTimeoutId) {
		window.clearTimeout(reconnectTimeoutId)
		reconnectTimeoutId = null
	}
}

function clearHeartbeat() {
	if (heartbeatIntervalId) {
		window.clearInterval(heartbeatIntervalId)
		heartbeatIntervalId = null
	}
}

function sendMessage(payload) {
	if (!socket || socket.readyState !== WebSocket.OPEN) {
		return false
	}

	socket.send(JSON.stringify(payload))
	return true
}

function requestStateSync() {
	sendMessage({
		type: 'ready',
		lastKnownItemId: currentItemId
	})
}

function startHeartbeat() {
	clearHeartbeat()
	heartbeatIntervalId = window.setInterval(() => {
		sendMessage({ type: 'ping' })
	}, HEARTBEAT_INTERVAL_MS)
}

function scheduleReconnect() {
	clearReconnectTimer()
	clearHeartbeat()
	reconnectAttempts += 1
	const delay = Math.min(MIN_RECONNECT_DELAY_MS * 2 ** (reconnectAttempts - 1), MAX_RECONNECT_DELAY_MS)
	reconnectTimeoutId = window.setTimeout(connect, delay)
}

function getChannelFromPathname(pathname) {
	if (pathname === '/' || pathname === '') {
		return 'global'
	}

	const userId = pathname.replace(/^\/+|\/+$/g, '')
	return `user:${userId}`
}

function getWebSocketUrl() {
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
	const channel = encodeURIComponent(getChannelFromPathname(window.location.pathname))
	return `${protocol}//${window.location.host}/ws?channel=${channel}`
}

function clearMediaShell() {
	if (activePlayer && typeof activePlayer.destroy === 'function') {
		activePlayer.destroy()
	}

	activePlayer = null
	mediaShellElement.replaceChildren()
}

function showIdentity(user) {
	if (!user) {
		identityElement.classList.add('hidden')
		identityAvatarElement.removeAttribute('src')
		identityAvatarElement.alt = ''
		identityNameElement.textContent = ''
		return
	}

	identityAvatarElement.src = user.avatar
	identityAvatarElement.alt = user.name
	identityNameElement.textContent = user.name
	identityElement.classList.remove('hidden')
}

function showCaption(caption) {
	if (!caption) {
		captionElement.textContent = ''
		captionElement.classList.add('hidden')
		return
	}

	captionElement.textContent = caption
	captionElement.classList.remove('hidden')
}

function notifyMediaEnded(itemId) {
	if (!itemId || itemId !== currentItemId) {
		return
	}

	sendMessage({
		type: 'media-ended',
		itemId
	})
}

function createMediaPlayer(item) {
	const player = document.createElement('media-player')
	player.setAttribute('title', item.caption || 'LiveChat Media')
	player.setAttribute('src', item.url)
	player.setAttribute('playsinline', '')

	if (item.type !== 'video/youtube') {
		player.setAttribute('crossorigin', '')
	}

	const provider = document.createElement('media-provider')
	const layout = document.createElement('media-video-layout')
	player.append(provider, layout)

	const handleEnded = () => notifyMediaEnded(item.id)
	player.addEventListener('ended', handleEnded)
	player.addEventListener('media-ended', handleEnded)

	return player
}

function renderItem(item) {
	currentItemId = item.id
	clearMediaShell()
	showIdentity(item.user)
	showCaption(item.caption)

	if (item.kind === 'caption') {
		return
	}

	if (item.type.startsWith('image/')) {
		const image = document.createElement('img')
		image.src = item.url
		image.alt = item.caption || 'LiveChat Media'
		mediaShellElement.append(image)
		return
	}

	if (item.type.startsWith('audio/') || item.type.startsWith('video/')) {
		const player = createMediaPlayer(item)
		activePlayer = player
		mediaShellElement.append(player)
	}
}

function clearCurrentItem() {
	currentItemId = null
	clearMediaShell()
	showIdentity(null)
	showCaption(null)
}

function handleServerMessage(message) {
	if (!message || typeof message.type !== 'string') {
		return
	}

	if (message.type === 'hello' || message.type === 'state') {
		if (message.state?.currentItem) {
			renderItem(message.state.currentItem)
		} else {
			clearCurrentItem()
		}
		return
	}

	if (message.type === 'play' && message.item) {
		renderItem(message.item)
		return
	}

	if (message.type === 'clear') {
		if (!message.itemId || message.itemId === currentItemId) {
			clearCurrentItem()
		}
		return
	}

	if (message.type === 'pong') {
		return
	}
}

function connect() {
	clearReconnectTimer()
	clearHeartbeat()

	if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
		return
	}

	socket = new WebSocket(getWebSocketUrl())

	socket.addEventListener('open', () => {
		reconnectAttempts = 0
		requestStateSync()
		startHeartbeat()
	})

	socket.addEventListener('message', (event) => {
		try {
			handleServerMessage(JSON.parse(event.data))
		} catch (error) {
			console.error('Message WebSocket invalide', error)
		}
	})

	socket.addEventListener('close', () => {
		clearHeartbeat()
		socket = null
		scheduleReconnect()
	})

	socket.addEventListener('error', () => {
		socket?.close()
	})
}

window.addEventListener('online', () => {
	if (!socket || socket.readyState === WebSocket.CLOSED) {
		connect()
	}
})

document.addEventListener('visibilitychange', () => {
	if (document.visibilityState !== 'visible') {
		return
	}

	if (socket?.readyState === WebSocket.OPEN) {
		requestStateSync()
		return
	}

	connect()
})

connect()
