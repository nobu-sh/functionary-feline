import type { Event } from "@/utils/events";
import ready from "@/events/ready";
import interactionCreate from "./interaction-create";

export default [
  ready,
  ...interactionCreate,
] satisfies readonly Event<any>[];
