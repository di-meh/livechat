import type { BotEvent } from '../../types/bot.js'

const readyEvent: BotEvent<'clientReady'> = {
	name: 'clientReady',
	once: true,
	execute(client: Parameters<BotEvent<'clientReady'>['execute']>[0]) {
		console.info(`Bot Discord connecté en tant que ${client.user.tag}`)
	}
}

export default readyEvent
