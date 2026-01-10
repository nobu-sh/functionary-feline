import type { Awaitable, ClientEvents } from "discord.js";
import type { CustomClient } from "@/classes/custom-client";
import { logger } from "@/logs";

export { Events } from "discord.js";
export type EventKeys = keyof ClientEvents;

export type EventCallback<T extends EventKeys> = (
  ...args: ClientEvents[T]
) => Awaitable<unknown>;

/// Internal struct that represents an event.
export interface Event<T extends EventKeys> {
  key: T;
  callback: EventCallback<T>;
}

/// Creates an event struct.
export function event<T extends EventKeys>(key: T, callback: EventCallback<T>): Event<T> {
  return { key, callback };
}

/// Registers events to the client.
export function registerEvents(client: CustomClient, events: Event<any>[]): void {
  for (const { key, callback } of events) {
    client.on(key, (...args) => {
      // Try to catch ucaught errors.
      try {
        // Call the callback. We cast to a ready client because if these events are being called its likely ready lol.
        callback(...args);
      }
      catch (error) {
        // Log the error.
        logger.error({ error }, "uncaught error in discord event handler for event '%s'", key);
      }
    });
  }
}
