import type { APIEmbed, InteractionReplyOptions } from "discord.js";
// import { MessageFlags } from "discord.js";

function unwrapEmbedArgument(descriptionOrEmbed: string | APIEmbed): APIEmbed {
  if (typeof descriptionOrEmbed === "string") {
    return { description: descriptionOrEmbed };
  }
  return descriptionOrEmbed;
}

export const Embed = {
  error: (descriptionOrEmbed: string | APIEmbed): InteractionReplyOptions => ({
    embeds: [{ color: 0xFF0000, ...unwrapEmbedArgument(descriptionOrEmbed) }],
    // flags: MessageFlags.Ephemeral,
  }),
  invalid: (descriptionOrEmbed: string | APIEmbed): InteractionReplyOptions => ({
    embeds: [{ color: 0xFFAA00, ...unwrapEmbedArgument(descriptionOrEmbed) }],
    // flags: MessageFlags.Ephemeral,
  }),
  success: (descriptionOrEmbed: string | APIEmbed): InteractionReplyOptions => ({
    embeds: [{ color: 0x00FF00, ...unwrapEmbedArgument(descriptionOrEmbed) }],
    // flags: MessageFlags.Ephemeral,
  }),
  info: (descriptionOrEmbed: string | APIEmbed): InteractionReplyOptions => ({
    embeds: [{ color: 0x00AAFF, ...unwrapEmbedArgument(descriptionOrEmbed) }],
    // flags: MessageFlags.Ephemeral,
  }),
} as const;
