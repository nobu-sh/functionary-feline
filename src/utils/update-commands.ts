// TODO: simplify this old code.

import type { APIApplicationCommandOption, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { createHash } from "node:crypto";
import { ApplicationCommandOptionType, REST, Routes, SlashCommandBuilder } from "discord.js";

const isPOJO = (x: any) => x && typeof x === "object" && !Array.isArray(x) && x.constructor === Object;

function sortKeysOnly(x: any): any {
  if (Array.isArray(x))
    return x.map(sortKeysOnly);
  if (!isPOJO(x))
    return x;
  const out: any = {};
  for (const k of Object.keys(x).sort()) out[k] = sortKeysOnly(x[k]);
  return out;
}

// Stable stringify that omits null/undefined/empties
function stableStringify(x: any): string {
  const pruned = sortKeysOnly(x);
  return JSON.stringify(pruned, (_k, v) => {
    if (v === null || v === undefined)
      return undefined;
    if (Array.isArray(v) && v.length === 0)
      return undefined;
    if (isPOJO(v) && Object.keys(v).length === 0)
      return undefined;
    return v;
  });
}

function normalizeOption(option: APIApplicationCommandOption): any {
  const base: any = {
    type: option.type,
    name: option.name,
    name_localizations: option.name_localizations ?? undefined,
    description: option.description,
    description_localizations: option.description_localizations ?? undefined,
    required: option.required ?? undefined,
  };

  switch (option.type) {
    case ApplicationCommandOptionType.Channel:
      // set-like: order-insensitive -> sort numeric
      base.channel_types = option.channel_types ? [...option.channel_types].sort((a, b) => a - b) : undefined;
      break;

    case ApplicationCommandOptionType.Integer:
    case ApplicationCommandOptionType.Number:
      base.min_value = option.min_value ?? undefined;
      base.max_value = option.max_value ?? undefined;
      base.autocomplete = option.autocomplete ?? undefined;
      // choices are shown in order → keep as-is
      base.choices = option.choices?.map(c => ({
        name: c.name,
        name_localizations: c.name_localizations ?? undefined,
        value: c.value,
      }));
      break;

    case ApplicationCommandOptionType.String:
      base.min_length = option.min_length ?? undefined;
      base.max_length = option.max_length ?? undefined;
      base.autocomplete = option.autocomplete ?? undefined;
      base.choices = option.choices?.map(c => ({
        name: c.name,
        name_localizations: c.name_localizations ?? undefined,
        value: c.value,
      }));
      break;

    case ApplicationCommandOptionType.Subcommand:
    case ApplicationCommandOptionType.SubcommandGroup:
      // options order is meaningful → keep as-is
      base.options = option.options?.map(normalizeOption);
      break;
  }
  return base;
}

export function fingerprintCommand(cmd: RESTPostAPIChatInputApplicationCommandsJSONBody) {
  const normalized = {
    type: cmd.type ?? 1, // default CHAT_INPUT
    name: cmd.name,
    name_localizations: cmd.name_localizations ?? undefined,
    description: cmd.description,
    description_localizations: cmd.description_localizations ?? undefined,
    // keep options order
    options: cmd.options?.map(normalizeOption),
    default_member_permissions: cmd.default_member_permissions ?? undefined,
    nsfw: cmd.nsfw ?? false,
    integration_types: cmd.integration_types ? [...cmd.integration_types].sort((a, b) => a - b) : undefined,
    // set-like: sort numeric (Discord may not guarantee order)
    contexts: cmd.contexts ? [...cmd.contexts].sort((a, b) => a - b) : undefined,
    handler: cmd.handler ?? undefined,
  };

  return createHash("sha256").update(stableStringify(normalized)).digest("hex");
}

export function fingerprintManyCommands(cmds: RESTPostAPIChatInputApplicationCommandsJSONBody[]) {
  // If there are no commands return a null byte hash
  if (cmds.length === 0) {
    return createHash("sha256").update("\0").digest("hex");
  }

  // order-insensitive across the *list* of commands
  const keyed = cmds.map(c => ({ k: `${c.type ?? 1}:${c.name}`, h: fingerprintCommand(c) }));
  keyed.sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0));
  return createHash("sha256").update(stableStringify(keyed.map(x => x.h))).digest("hex");
}

export interface RegisterManyCommandsArgs {
  commands: Array<RESTPostAPIChatInputApplicationCommandsJSONBody | SlashCommandBuilder>;
  appId: string;
  token: string;
  guildId?: string;
}

export interface RegisterManyCommandsResult {
  updated: boolean;
  localFingerprint: string;
  remoteFingerprint: string;
}

export async function updateCommandsIfChanged({ commands, appId, token, guildId }: RegisterManyCommandsArgs) {
  const localFingerprint = fingerprintManyCommands(commands.map(command => command instanceof SlashCommandBuilder ? command.toJSON() : command));
  const rest = new REST({ version: "10" }).setToken(token);

  const apiRoute = guildId ? Routes.applicationGuildCommands(appId, guildId) : Routes.applicationCommands(appId);
  const remoteCommands = await rest.get(apiRoute) as RESTPostAPIChatInputApplicationCommandsJSONBody[];
  const remoteFingerprint = fingerprintManyCommands(remoteCommands);

  if (localFingerprint === remoteFingerprint) {
    return { updated: false, localFingerprint, remoteFingerprint };
  }

  await rest.put(apiRoute, { body: commands.map(command => command instanceof SlashCommandBuilder ? command.toJSON() : command) });
  return { updated: true, localFingerprint, remoteFingerprint };
}
