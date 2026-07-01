import type { ChatInputCommandInteraction, ClientEvents, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js'

export type SlashCommandData = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder

export type BotCommand = {
	data: SlashCommandData
	toJSON?: () => RESTPostAPIChatInputApplicationCommandsJSONBody
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>
	registerScope?: 'global' | 'guild'
}

export type BotEvent<K extends keyof ClientEvents = keyof ClientEvents> = {
	name: K
	once?: boolean
	execute: (...args: ClientEvents[K]) => Promise<void> | void
}
