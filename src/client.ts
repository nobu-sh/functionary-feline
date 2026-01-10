import { GatewayIntentBits } from "discord.js";
import { CustomClient } from "@/classes/custom-client";
import Environment from "@/env";

export const client = new CustomClient({
  token: Environment.discordBotToken,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildExpressions,
  ],
});
