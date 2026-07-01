import {
  Colors,
  GuildMember,
  MessageFlags,
  type APIEmbedField,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type User,
} from "discord.js";
import type { LiveChatTarget, LiveChatUser } from "../types/livechat.js";

function isGuildMember(
  member: ChatInputCommandInteraction["member"],
): member is GuildMember {
  return member instanceof GuildMember;
}

export async function createLiveChatUser(
  interaction: ChatInputCommandInteraction,
  isAnonymous: boolean | null,
): Promise<LiveChatUser | null> {
  if (isAnonymous) {
    return null;
  }

  let displayName = interaction.user.username;

  if (interaction.inCachedGuild()) {
    displayName = interaction.member.displayName;
  } else if (isGuildMember(interaction.member)) {
    displayName = interaction.member.displayName;
  } else if (interaction.guild) {
    const guildUser = await interaction.guild.members
      .fetch(interaction.user.id)
      .catch(() => null);
    displayName = guildUser?.displayName ?? interaction.user.username;
  }

  return {
    name: displayName,
    avatar: interaction.user.displayAvatarURL({ size: 256 }),
  };
}

export function getDisplayName(user: LiveChatUser | null): string {
  return user?.name ?? "Anonyme";
}

export function getTargetDescription(
  target: LiveChatTarget,
  targetUser: User | null,
): string {
  if (target.kind === "global") {
    return "Flux global (/)";
  }

  return `Flux utilisateur (/${target.userId})${targetUser ? ` - ${targetUser.username}` : ""}`;
}

export function createLiveChatReply(input: {
  fields: APIEmbedField[];
  interaction: ChatInputCommandInteraction;
  isAnonymous: boolean | null;
  target: LiveChatTarget;
  targetUser: User | null;
  title?: string;
}): Promise<unknown> {
  const reply: InteractionReplyOptions = {
    embeds: [
      {
        title: input.title ?? "Livechat envoyé !",
        color: Colors.Green,
        thumbnail: input.isAnonymous
          ? undefined
          : {
              url: input.interaction.user.displayAvatarURL({ size: 256 }),
            },
        fields: [
          ...input.fields,
          {
            name: "Destination",
            value: getTargetDescription(input.target, input.targetUser),
          },
        ],
      },
    ],
    flags: MessageFlags.Ephemeral,
  };

  return input.interaction.reply(reply);
}
