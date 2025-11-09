import { MessagePayload, SyncServer } from "@robojs/sync/server.js";
import { APIEmbedField, Colors, CommandInteraction, InteractionResponse, MessageFlags } from "discord.js";
import { CommandOptions, createCommandConfig, getState } from "robo.js";
import { WebSocketServer } from "ws";
import type { LiveChatData } from "../../types/livechat";

export const config = createCommandConfig({
	timeout: 2000,
	description: 'Choisis une vidéo YouTube a envoyer via LiveChat',
	options: [
		{
			name: 'url',
			description: "L'url à envoyer",
			type: 'string',
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
			name: "maxtime",
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
    const url = options.url as string;
    const videoIdRE = /(?:youtu\.be|youtube|youtube\.com|youtube-nocookie\.com)(?:\/shorts)?\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|)((?:\w|-){11})/;
    if (!url.match(videoIdRE)) {
        return interaction.reply({
            content: "L'URL fournie n'est pas une URL YouTube valide. Veuillez réessayer.",
            flags: MessageFlags.Ephemeral
        });
    }
    const caption = options.caption;
    const type = 'video/youtube';
    const maxTime = options.maxtime;
	const guildUser = await interaction.guild?.members.fetch(interaction.user);
    const displayName = guildUser?.displayName ?? interaction.user.username;
    const user = options.anon ? null : {
		name: displayName,
		avatar: interaction.user.displayAvatarURL({ size: 256 })
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
		const clients = wss.clients;
		clients.forEach((client) => {
			client.send(JSON.stringify(payload))
		})
	}

	const fields : APIEmbedField[] = [
		{name: 'Username', value: options.anon ? "Personne tkt" : displayName},
		{name: "Message", value: caption ?? ""},
		{name: "Type de fichier", value: type},
		{name: "URL", value: url},
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