import { CommandInteraction, MessageFlags } from 'discord.js'
import { CommandOptions, CommandResult, createCommandConfig } from 'robo.js'
import { SyncServer } from '@robojs/sync/server.js'
import type { WebSocketServer } from 'ws'
import { MessagePayload } from '@robojs/sync/server.js'
import type { LiveChatData } from '../../types/livechat.js'

export const config = createCommandConfig({
	timeout: 5000,
	description: 'Choisis un média à envoyer via LiveChat',
	options: [
		{
			name: 'file',
			description: 'Le média à envoyer',
			type: 'attachment',
			required: true
		},
		{
			name: 'caption',
			description: 'Légende à ajouter au média (optionnel)',
			type: 'string',
			required: false
		},
		{
			name: 'maxtime',
			description: "Nombre de secondes maximum pour l'affichage du média (optionnel)",
			type: 'number',
			required: false,
			min: 1,
            max: 30
		},
		{
			name: 'anon',
			description: 'Envoyer le média de manière anonyme (sans nom + avatar)',
			type: 'boolean',
			required: false,
		}
	]
} as const)

export default async (
	interaction: CommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const url = options.file.url as string
	const caption = options.caption as string | undefined
	const type = options.file.contentType
	const maxTime = options.maxtime;
	const user = options.anon ? null : {
		name: interaction.user.username,
		avatar: interaction.user.displayAvatarURL({ size: 256 })
	}

	if (!type?.startsWith('audio/') && !type?.startsWith('video/') && !type?.startsWith('image/')) {
		return {
			content: 'Le fichier doit être un fichier audio, image ou vidéo ! Type du fichier envoyé: ' + type,
			flags: MessageFlags.Ephemeral
		}
	}

	const wss = SyncServer.getSocketServer() as WebSocketServer | undefined
	const payload: MessagePayload<LiveChatData> = {
		data: {
			type,
			user,
			url,
			caption: caption || null,
			maxTime: maxTime || null
		},
		type: 'update',
		key: ['livechat']
	}
	if (wss) {
		const clients = wss.clients
		clients.forEach((client) => {
			client.send(JSON.stringify(payload))
		})
	}

	// Envoyer les données du média via LiveChat (WebSocket)

	const response = `Média de type **${type}** envoyé via LiveChat par ${user?.name ?? "Personne"}, url de son image: ${user?.avatar ?? "Non disponible"} !\nURL: ${url}${caption ? `\nLégende: ${caption}` : ''}\nTaille du fichier: ${options.file.size} bytes`
	return { content: response, flags: MessageFlags.Ephemeral };
}
