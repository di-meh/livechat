import { createConnectionController } from './client-connection.js'
import { createMediaController } from './client-media.js'

const media = createMediaController()
const connection = createConnectionController({
	getCurrentItemId: media.getCurrentItemId,
	onServerMessage: handleServerMessage
})

media.setOnMediaEnded((itemId) => {
	connection.sendMessage({
		type: 'media-ended',
		itemId
	})
})

function handleServerMessage(message) {
	if (!message || typeof message.type !== 'string') {
		return
	}

	if (message.type === 'hello' || message.type === 'state') {
		if (message.state?.currentItem) {
			if (message.state.currentItem.id === media.getCurrentItemId()) {
				return
			}

			media.renderItem(message.state.currentItem)
		} else {
			media.clearCurrentItem()
		}
		return
	}

	if (message.type === 'play' && message.item) {
		media.renderItem(message.item)
		return
	}

	if (message.type === 'clear') {
		if (!message.itemId || message.itemId === media.getCurrentItemId()) {
			media.clearCurrentItem()
		}
		return
	}

	if (message.type === 'pong') {
		return
	}
}
connection.connect()
