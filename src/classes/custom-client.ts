import type { ClientOptions } from "discord.js";
import { Client } from "discord.js";
import events from "@/events";
import { registerEvents } from "@/utils/events";

export class CustomClient<Ready extends boolean = boolean> extends Client<Ready> {
  private _intervals: Set<NodeJS.Timeout> = new Set();

  public constructor(options: ClientOptions & { token: string }) {
    super(options);
    this.token = options.token as any;
    registerEvents(this, events);
  }

  public registerInterval(interval: NodeJS.Timeout): void {
    this._intervals.add(interval);
  }

  public removeInterval(interval: NodeJS.Timeout): void {
    this._intervals.delete(interval);
  }

  public clearIntervals(): void {
    for (const interval of this._intervals) {
      clearInterval(interval);
    }
    this._intervals.clear();
  }

  public override async destroy(): Promise<void> {
    this.clearIntervals();
    return super.destroy();
  }
}
