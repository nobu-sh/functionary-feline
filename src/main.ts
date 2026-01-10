import process from "node:process";
import { client } from "@/client";
import commands from "@/commands";
import Environment, { isDevelopment } from "@/env";
import { logger } from "@/logs";
import { GracefulShutdownError, onSignalledShutdown } from "@/utils/shutdown";
import { updateCommandsIfChanged } from "@/utils/update-commands";

// ANCHOR - Start application
try {
  // Attempt to update the commands
  const { updated, localFingerprint, remoteFingerprint } = await updateCommandsIfChanged({
    commands: commands.tree,
    appId: Environment.discordAppId,
    token: Environment.discordBotToken,
    guildId: isDevelopment ? Environment.testGuildId : undefined,
  });
  if (updated) {
    logger.info("commands updated due to fingerprint mismatch (%s -> %s)", remoteFingerprint, localFingerprint);
  }
  else {
    logger.info("no command changes detected (fingerprint: %s)", localFingerprint);
  }

  // Start the client.
  await client.login();
}
catch (error) {
  logger.fatal({ error }, "failed to start application");
  process.exit(1);
}

// ANCHOR - Graceful shutdown
const shutdown = onSignalledShutdown(
  // Destroy the client.
  () => client.destroy(),
);

// Handle shutdown completion
// eslint-disable-next-line ts/no-floating-promises
shutdown.then(() => {
  logger.info("graceful shutdown complete, exiting...");
  process.exit(0);
});

// Handle shutdown errors
shutdown.catch((error) => {
  if (error instanceof GracefulShutdownError) {
    logger.error({ error }, "graceful shutdown encountered errors");
  }
  else {
    logger.fatal({ error }, "graceful shutdown failed unexpectedly");
  }

  process.exit(1);
});
