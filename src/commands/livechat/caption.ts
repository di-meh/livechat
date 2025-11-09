import { MessagePayload, SyncServer } from "@robojs/sync/server.js";
import { APIEmbedField, Colors, CommandInteraction, InteractionResponse, MessageFlags } from "discord.js";
import { CommandOptions, createCommandConfig } from "robo.js";
import { WebSocketServer } from "ws";
import { LiveChatData } from "../../types/livechat";
import { getState } from 'robo.js'

export const config = createCommandConfig({
    timeout: 2000,
	description: 'Envoie un message sur le livechat',
	options: [
		{
			name: 'caption',
			description: 'Message à envoyer (128 caractères max)',
			type: 'string',
			required: true,
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
    const caption = options.caption as string;
    const maxTime = options.maxtime as number | undefined;
    const guildUser = await interaction.guild?.members.fetch(interaction.user);
    const displayName = guildUser?.displayName ?? interaction.user.username;
    const user = options.anon ? null : {
		name: displayName,
		avatar: interaction.user.displayAvatarURL({ size: 256 })
	}

    const wss = SyncServer.getSocketServer() as WebSocketServer | undefined

    const liveChatState = getState<LiveChatData[]>('livechat-queue') ?? []
    liveChatState.push(
        {
            type: null,
            user,
            url: null,
            caption: caption,
            maxTime: maxTime ?? null
        });

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
            {name: "Message", value: caption},
            {name: "Max Time", value: `${maxTime ?? 5}sec`}
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