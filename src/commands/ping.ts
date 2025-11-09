import { client, createCommandConfig, logger } from 'robo.js'
import { Colors, InteractionResponse, type ChatInputCommandInteraction } from 'discord.js'
import os from 'node:os'

/*
 * Customize your command details and options here.
 *
 * For more information, see the documentation:
 * https://robojs.dev/discord-bots/commands#command-options
 */
export const config = createCommandConfig({
	description: 'Répond avec Pong et diverses infos.'
} as const)

/**
 * This is your command handler that will be called when the command is used.
 * You can either use the `interaction` Discord.js object directly, or return a string or object.
 *
 * For more information, see the documentation:
 * https://robojs.dev/discord-bots/commands
 */
export default (interaction: ChatInputCommandInteraction): Promise<InteractionResponse> => {
	logger.info(`Ping command used by ${interaction.user}`)

	const cpuUsage = process.cpuUsage()
	const cpuUsagePercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2)

	const memoryUsage = process.memoryUsage().rss / (1024 * 1024)
	const totalMemory = os.totalmem() / (1024 * 1024 * 1024)
	const freeMemory = os.freemem() / (1024 * 1024 * 1024)

	return interaction.reply({
		embeds: [
			{
				title: 'Pong la con de ta mère',
				color: Colors.Green,
				fields: [
					{ name: 'Ping', value: `${client.ws.ping}ms`, inline: false },
					{ name: 'CPU Usage', value: `${cpuUsagePercent}%`, inline: false },
					{ name: 'RAM Usage', value: `${memoryUsage.toFixed(2)} MB`, inline: false },
					{ name: 'Total RAM', value: `${totalMemory.toFixed(2)} GB`, inline: false },
					{ name: 'Available RAM', value: `${freeMemory.toFixed(2)} GB`, inline: false },
					{
						name: 'Operating System',
						value: `${os.platform()} ${os.version()} ${os.arch()} (${os.release()})`,
						inline: false
					},
				]
			}
		]
	});
}
