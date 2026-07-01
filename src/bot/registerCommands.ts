import { REST, Routes } from "discord.js";
import type { Collection } from "discord.js";
import type { BotCommand } from "../types/bot.js";

export async function registerCommands(
  commands: Collection<string, BotCommand>,
): Promise<void> {
  const discordToken = process.env.DISCORD_TOKEN;
  const discordClientId = process.env.DISCORD_CLIENT_ID;

  if (!discordToken || !discordClientId) {
    throw new Error("Missing required Discord environment variables");
  }

  const rest = new REST({ version: "10" }).setToken(discordToken);
  const body = [...commands.values()].map((command) => command.data.toJSON());

  if (process.env.DISCORD_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(
        discordClientId,
        process.env.DISCORD_GUILD_ID,
      ),
      {
        body,
      },
    );
    return;
  }

  await rest.put(Routes.applicationCommands(discordClientId), {
    body,
  });
}
