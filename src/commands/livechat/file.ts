import { APIEmbedField, Colors, CommandInteraction, InteractionResponse, MessageFlags } from 'discord.js'
import { CommandOptions, createCommandConfig, getState } from 'robo.js'
import { SyncServer } from '@robojs/sync/server.js'
import type { WebSocketServer } from 'ws'
import { MessagePayload } from '@robojs/sync/server.js'
import type { LiveChatData } from '../../types/livechat.js'

export const config = createCommandConfig({
	timeout: 2000,
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
			required: false,
			max: 128
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
): Promise<InteractionResponse> => {
	const url = options.file.url as string
	const caption = options.caption as string | undefined
	const type = options.file.contentType
	const maxTime = options.maxtime;
	const guildUser = await interaction.guild?.members.fetch(interaction.user);
    const displayName = guildUser?.displayName ?? interaction.user.username;
	const user = options.anon ? null : {
		name: displayName,
		avatar: interaction.user.displayAvatarURL({ size: 256 })
	}

	if (!type?.startsWith('audio/') && !type?.startsWith('video/') && !type?.startsWith('image/')) {
		return interaction.reply({
			content: 'Le fichier doit être un fichier audio, image ou vidéo ! Type du fichier envoyé: ' + type,
			flags: MessageFlags.Ephemeral
		})
	}

	const wss = SyncServer.getSocketServer() as WebSocketServer | undefined
	const liveChatState = getState<LiveChatData[]>('livechat-queue') ?? []
	liveChatState.push({
			type,
			user,
			url,
			caption: caption || null,
			maxTime: maxTime || null
		})
	const payload: MessagePayload<LiveChatData[]> = {
		data: liveChatState,
		type: 'update',
		key: ['livechat']
	}
	if (wss) {
		const clients = wss.clients
		clients.forEach((client) => {
			client.send(JSON.stringify(payload))
		})
	}

	const fields : APIEmbedField[] = [
		{name: 'Username', value: options.anon ? "Personne tkt" : displayName},
		{name: "Message", value: caption ?? ""},
		{name: "Type de fichier", value: type},
		{name: "URL", value: url},
		{name: "Taille du fichier", value: `${options.file.size} bytes`},
		{name: "Max Time", value: maxTime ? `${maxTime}sec` : "La durée de la vidéo"}
	];
	return interaction.reply({ 
		embeds: [
			{
				title: "Livechat envoyé !",
				color: Colors.Green,
				thumbnail: options.anon ? undefined : {
					url: interaction.user.displayAvatarURL({size:256})
				},
				fields
			}
		], 
		flags: MessageFlags.Ephemeral 
	});
}
