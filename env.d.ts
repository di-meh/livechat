export {}
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_OPTIONS: string
			PORT: string
			DISCORD_CLIENT_ID: string
			DISCORD_TOKEN: string
			DISCORD_GUILD_ID: string
			NODE_ENV?: 'development' | 'production' | 'test'
		}
	}
}
