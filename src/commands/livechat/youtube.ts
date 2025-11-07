import { MessagePayload, SyncServer } from "@robojs/sync/server.js";
import { CommandInteraction, MessageFlags } from "discord.js";
import { CommandOptions, CommandResult, createCommandConfig } from "robo.js";
import { WebSocketServer } from "ws";
import type { LiveChatData } from "../../types/livechat";

export const config = createCommandConfig({
	timeout: 5000,
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
			required: false
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
): Promise<CommandResult> => {
    const url = options.url as string;
    const videoIdRE = /(?:youtu\.be|youtube|youtube\.com|youtube-nocookie\.com)(?:\/shorts)?\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|)((?:\w|-){11})/;
    if (!url.match(videoIdRE)) {
        return {
            content: "L'URL fournie n'est pas une URL YouTube valide. Veuillez réessayer.",
            flags: MessageFlags.Ephemeral
        };
    }
    const caption = options.caption;
    const type = 'video/youtube';
    const maxTime = options.maxtime;
    const user = options.anon ? null : {
		name: interaction.user.username,
		avatar: interaction.user.displayAvatarURL({ size: 256 })
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
		const clients = wss.clients;
		clients.forEach((client) => {
			client.send(JSON.stringify(payload))
		})
	}
	const response = `Média de type **${type}** envoyé via LiveChat par ${user?.name ?? "Personne"}, url de son image: ${user?.avatar ?? "Non disponible"} !\nURL: ${url}${caption ? `\nLégende: ${caption}` : ''}`
    interaction.reply({ content: response, flags: MessageFlags.Ephemeral })

    
}