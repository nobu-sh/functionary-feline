import type { InteractionEditReplyOptions } from "discord.js";
import { AttachmentBuilder, ContainerBuilder, FileBuilder, MediaGalleryBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";
import { createProgressBar } from "@/utils/canvas";

export function createProgressMessage({
  progress,
  header,
  footer,
}: {
  progress: number; // 0.0 - 1.0
  header?: string[];
  footer?: string[];
}): InteractionEditReplyOptions {
  const initial = createProgressBar(progress);
  const attachment = new AttachmentBuilder(initial, { name: "progress.webp" });

  const gallery = new MediaGalleryBuilder({
    items: [
      {
        media: {
          url: `attachment://progress.webp`,
        },
      },
    ],
  });

  const container = new ContainerBuilder({ accent_color: 0xE594B7 });

  header?.forEach((line) => {
    container.addTextDisplayComponents(new TextDisplayBuilder({ content: line }));
  });

  container.addMediaGalleryComponents(gallery);

  footer?.forEach((line) => {
    container.addTextDisplayComponents(new TextDisplayBuilder({ content: line }));
  });

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    files: [attachment],
  };
}

export function createFileMessage({
  attachment,
  header,
  footer,
}: {
  attachment: AttachmentBuilder;
  header?: string[];
  footer?: string[];
}): InteractionEditReplyOptions {
  const container = new ContainerBuilder({ accent_color: 0xE594B7 });

  header?.forEach((line) => {
    container.addTextDisplayComponents(new TextDisplayBuilder({ content: line }));
  });

  container.addFileComponents(new FileBuilder({ file: { url: `attachment://${attachment.name}` } }));

  footer?.forEach((line) => {
    container.addTextDisplayComponents(new TextDisplayBuilder({ content: line }));
  });

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    files: [attachment],
  };
}
