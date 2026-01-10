import commands from "@/commands";
import { logger } from "@/logs";
import { interaction } from "@/utils/interaction";

export default interaction(async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.user.bot) {
    return;
  }

  const key = commands.key({
    name: interaction.commandName,
    group: interaction.options.getSubcommandGroup(false),
    subcommand: interaction.options.getSubcommand(false),
  });
  const path = commands.lookupPath(key);
  if (!path) {
    return logger.warn("no command path found for key '%s'", key);
  }

  return commands.run(path, interaction);
});
