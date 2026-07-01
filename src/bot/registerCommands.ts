import { REST, Routes } from "discord.js";
import type { Collection } from "discord.js";
import type { BotCommand } from "../types/bot.js";

export async function registerCommands(
  commands: Collection<string, BotCommand>,
): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const body = [...commands.values()].map((command) => command.data.toJSON());

  if (process.env.DISCORD_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID,
      ),
      {
        body,
      },
    );
    return;
  }

  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
    body,
  });
}
