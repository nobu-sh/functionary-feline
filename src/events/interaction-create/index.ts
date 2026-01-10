import type { Event, Events } from "@/utils/events";
import onCommand from "@/events/interaction-create/on-command";

export default [
  onCommand,
] satisfies readonly Event<Events.InteractionCreate>[];
