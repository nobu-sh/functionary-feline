import { ActivityType } from "discord.js";
import packageJson from "@/../package.json" assert { type: "json" };
import { client } from "@/client";
import { logger } from "@/logs";
import { CircularBuffer } from "@/utils/circular-buffer";
import { event, Events } from "@/utils/events";

const statuses = new CircularBuffer([
  "meow meow meow",
]);

function updateStatus() {
  client.user!.setActivity({
    name: `${statuses.next()} | v${packageJson.version}`,
    type: ActivityType.Watching,
  });
}

export default event(Events.ClientReady, () => {
  logger.info(`logged in as ${client.user!.tag}!`);

  // Register the interval. Cleanup will handle stopping intervals.
  updateStatus();
  client.registerInterval(setInterval(() => {
    updateStatus();
  }, 30_000));
});
