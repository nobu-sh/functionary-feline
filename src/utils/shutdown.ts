import process from "node:process";
import { defer } from "@/utils/defer";

export const ShutdownSignals = ["SIGINT", "SIGTERM", "SIGQUIT"] as const satisfies NodeJS.Signals[];
export type ShutdownSignal = (typeof ShutdownSignals)[number];
export type GracefulShutdownHandler = (signal: ShutdownSignal) => unknown | PromiseLike<unknown>;

export class GracefulShutdownError extends AggregateError {
  public override name = "GracefulShutdownError";
  public constructor(public readonly errors: unknown[], public readonly message: string) {
    super(errors, message);
  }
}

/**
 * Callback will be called when a shutdown signal is received. It is recommended to pass a handler
 * per shutdown task. They run in series and if one fails, it will continue to the next and throw
 * an aggregate error at the end.
 */
export function onSignalledShutdown(...handlers: GracefulShutdownHandler[]): Promise<void> {
  const { resolve, reject, promise } = defer<void>();
  let isShuttingDown = false;

  async function runHandlers(signal: ShutdownSignal) {
    // Debounce multiple signals
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    const errors: unknown[] = [];

    for (const fn of handlers) {
      try {
        await fn(signal);
      }
      catch (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      return reject(new GracefulShutdownError(errors, "One or more handlers failed during graceful shutdown."));
    }

    return resolve();
  }

  for (const signal of ShutdownSignals) {
    process.on(signal, async () => {
      return runHandlers(signal);
    });
  }

  return promise;
}
