import type { EventCallback } from "@/utils/events";
import { codeBlock } from "discord.js";
import { logger } from "@/logs";
import { Embed } from "@/utils/embeds";
import { createErrorTraceCode } from "@/utils/errors";
import { event, Events } from "@/utils/events";

export function interaction(callback: EventCallback<Events.InteractionCreate>) {
  return event(Events.InteractionCreate, async (interaction) => {
    try {
      return await callback(interaction);
    }
    catch (error) {
      const traceId = createErrorTraceCode();
      logger.error({ error, traceId }, "error running interaction handler");

      if (!interaction.isRepliable()) {
        return;
      }

      const message = `An error occurred while processing your request.\n${codeBlock(`Trace Id: ${traceId}`)}`;
      if (interaction.replied || interaction.deferred) {
        return interaction.followUp(Embed.error(message));
      }
      else {
        return interaction.reply(Embed.error(message));
      }
    }
  });
}
