const MIN_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 10000
const HEARTBEAT_INTERVAL_MS = 15000

export function createConnectionController({ getCurrentItemId, onServerMessage }) {
	let socket = null
	let reconnectAttempts = 0
	let reconnectTimeoutId = null
	let heartbeatIntervalId = null

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
			lastKnownItemId: getCurrentItemId()
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
				onServerMessage(JSON.parse(event.data))
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

	return {
		connect,
		sendMessage
	}
}
