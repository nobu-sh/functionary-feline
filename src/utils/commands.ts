// TODO: simplify this older code eventually. D.JS has a lot of type gymnastics that are a pain to work with.

import type {
  Awaitable,
  CacheType,
  ChatInputCommandInteraction,
} from "discord.js";
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

export type CommandContextNext = () => Promise<unknown>;
export interface CommandContext {
  properties: Map<string, any>;
  interaction: ChatInputCommandInteraction<CacheType>;
  setProperty: <T>(key: string, value: T) => void;
  getProperty: <T>(key: string) => T | undefined;
}

// Let handlers return unknown just sugar for shorter return syntax
export type CommandMiddleware = (context: CommandContext, next: CommandContextNext) => Awaitable<unknown>;

export class MiddlewareError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "MiddlewareError";
  }
}

export function compose(middlewares: CommandMiddleware[]) {
  return function run(ctx: CommandContext, outNext: CommandContextNext = async () => {}) {
    let index = -1;
    return dispatch(0);

    function dispatch(i: number): Promise<unknown> {
      if (i <= index) {
        return Promise.reject(new MiddlewareError("next() called multiple times"));
      }
      index = i;

      const fn = i < middlewares.length ? middlewares[i] : outNext;
      try {
        return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
      }
      catch (err) {
        return Promise.reject(err);
      }
    }
  };
}

// Composables
interface ICommandMiddlewareRegistry {
  handler: (handler: CommandMiddleware) => this;
  readonly handlers: Set<CommandMiddleware>;
}

interface ICommandGroupRegistry {
  groups: Map<string, SubcommandGroupBuilder>;
}

interface ICommandSubcommandRegistry {
  subcommands: Map<string, SubcommandBuilder>;
}

// TODO - when addSubcommand or addSubcommandGroup is called, it doesn't invalidate using base command options
export class CommandBuilder extends SlashCommandBuilder implements
ICommandMiddlewareRegistry, ICommandGroupRegistry, ICommandSubcommandRegistry {
  private _handlers: Set<CommandMiddleware> = new Set();
  private _groups: Map<string, SubcommandGroupBuilder> = new Map();
  private _subcommands: Map<string, SubcommandBuilder> = new Map();

  public constructor() {
    super();
  }

  public get groups() {
    return this._groups;
  }

  public get subcommands() {
    return this._subcommands;
  }

  public handler(handler: CommandMiddleware) {
    this._handlers.add(handler);
    return this;
  }

  public get handlers() {
    return this._handlers;
  }

  public addSubcommandGroup(input: SubcommandGroupBuilder): this {
    this._groups.set(input.name, input);
    super.addSubcommandGroup(input);
    return this;
  }

  public addSubcommand(input: SubcommandBuilder): this {
    this._subcommands.set(input.name, input);
    super.addSubcommand(input);
    return this;
  }

  public addAttachmentOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addAttachmentOption>): this {
    super.addAttachmentOption(...input);
    return this;
  }

  public addBooleanOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addBooleanOption>): this {
    super.addBooleanOption(...input);
    return this;
  }

  public addChannelOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addChannelOption>): this {
    super.addChannelOption(...input);
    return this;
  }

  public addIntegerOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addIntegerOption>): this {
    super.addIntegerOption(...input);
    return this;
  }

  public addMentionableOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addMentionableOption>): this {
    super.addMentionableOption(...input);
    return this;
  }

  public addNumberOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addNumberOption>): this {
    super.addNumberOption(...input);
    return this;
  }

  public addRoleOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addRoleOption>): this {
    super.addRoleOption(...input);
    return this;
  }

  public addStringOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addStringOption>): this {
    super.addStringOption(...input);
    return this;
  }

  public addUserOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addUserOption>): this {
    super.addUserOption(...input);
    return this;
  }
}

export class SubcommandGroupBuilder extends SlashCommandSubcommandGroupBuilder implements
ICommandMiddlewareRegistry, ICommandSubcommandRegistry {
  private _handlers: Set<CommandMiddleware> = new Set();
  private _subcommands: Map<string, SubcommandBuilder> = new Map();

  public constructor() {
    super();
  }

  public get subcommands() {
    return this._subcommands;
  }

  public handler(handler: CommandMiddleware) {
    this._handlers.add(handler);
    return this;
  }

  public get handlers() {
    return this._handlers;
  }

  public addSubcommand(input: SubcommandBuilder): this {
    this._subcommands.set(input.name, input);
    super.addSubcommand(input);
    return this;
  }
}

export class SubcommandBuilder extends SlashCommandSubcommandBuilder implements
ICommandMiddlewareRegistry {
  private _handlers: Set<CommandMiddleware> = new Set();

  public constructor() {
    super();
  }

  public handler(handler: CommandMiddleware) {
    this._handlers.add(handler);
    return this;
  }

  public get handlers() {
    return this._handlers;
  }

  public addAttachmentOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addAttachmentOption>): this {
    super.addAttachmentOption(...input);
    return this;
  }

  public addBooleanOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addBooleanOption>): this {
    super.addBooleanOption(...input);
    return this;
  }

  public addChannelOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addChannelOption>): this {
    super.addChannelOption(...input);
    return this;
  }

  public addIntegerOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addIntegerOption>): this {
    super.addIntegerOption(...input);
    return this;
  }

  public addMentionableOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addMentionableOption>): this {
    super.addMentionableOption(...input);
    return this;
  }

  public addNumberOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addNumberOption>): this {
    super.addNumberOption(...input);
    return this;
  }

  public addRoleOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addRoleOption>): this {
    super.addRoleOption(...input);
    return this;
  }

  public addStringOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addStringOption>): this {
    super.addStringOption(...input);
    return this;
  }

  public addUserOption(...input: Parameters<typeof SlashCommandBuilder.prototype.addUserOption>): this {
    super.addUserOption(...input);
    return this;
  }
}

export type AnyCommandBuilder = CommandBuilder | SubcommandGroupBuilder | SubcommandBuilder;
export type CommandRegistryKey = string & { __brand?: "CommandRegistryKey" };
export interface CommandRegistryKeyArgs {
  name: string;
  group?: string | null;
  subcommand?: string | null;
}
export class CommandRegistry implements ICommandMiddlewareRegistry {
  private _handlers: Set<CommandMiddleware> = new Set();
  private commands: Map<string, CommandBuilder> = new Map();
  private flattenedCommands: Map<string, Array<AnyCommandBuilder>> = new Map();

  public constructor(commands: CommandBuilder[] = []) {
    for (const command of commands) {
      this.register(command);
    }
  }

  public get tree() {
    return Array.from(this.commands.values());
  }

  public handler(handler: CommandMiddleware) {
    this._handlers.add(handler);
    return this;
  }

  public get handlers() {
    return this._handlers;
  }

  public key({ name, group, subcommand }: CommandRegistryKeyArgs): CommandRegistryKey {
    if (group && subcommand) {
      return `${name}.${group}.${subcommand}`;
    }
    if (subcommand) {
      return `${name}.${subcommand}`;
    }
    return name;
  }

  public register(command: CommandBuilder): this {
    this.commands.set(command.name, command);
    this.flattenedCommands.set(this.key({ name: command.name }), [command]);
    for (const subcommand of command.subcommands.values()) {
      this.flattenedCommands.set(this.key({ name: command.name, subcommand: subcommand.name }), [command, subcommand]);
    }
    for (const group of command.groups.values()) {
      for (const subcommand of group.subcommands.values()) {
        this.flattenedCommands.set(this.key({ name: command.name, group: group.name, subcommand: subcommand.name }), [command, group, subcommand]);
      }
    }

    return this;
  }

  public lookupPath(key: CommandRegistryKey): Array<AnyCommandBuilder> | undefined {
    return this.flattenedCommands.get(key);
  }

  public lookup(key: CommandRegistryKey): AnyCommandBuilder | undefined {
    return this.lookupPath(key)?.at(-1);
  }

  public run(path: Array<AnyCommandBuilder>, interaction: ChatInputCommandInteraction<CacheType>) {
    const middleware = [...this.handlers, ...path.flatMap(part => Array.from(part.handlers))];
    const ctx: CommandContext = {
      properties: new Map(),
      interaction,
      setProperty: (key, value) => ctx.properties.set(key, value),
      getProperty: key => ctx.properties.get(key),
    };

    return compose(middleware)(ctx);
  }
}
