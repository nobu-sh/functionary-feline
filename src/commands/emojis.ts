import type { Snowflake } from "discord.js";
import { Buffer } from "node:buffer";
import { AttachmentBuilder, codeBlock, inlineCode, parseEmoji } from "discord.js";
import pThrottle from "p-throttle";
import { CommandBuilder } from "@/utils/commands";
import { Embed } from "@/utils/embeds";
import { createFileMessage, createProgressMessage } from "@/utils/progress";
import { throttleLatest } from "@/utils/throttle-latest";
import { wait } from "@/utils/wait";
import { zipToBuffer } from "@/utils/zip-to-buffer";

export default new CommandBuilder()
  .setName("emojis")
  .setDescription("Will return with a zip file containing emojis given")
  .addStringOption(option =>
    option
      .setName("input")
      .setDescription("The emojis to download. No fixed size limit.")
      .setRequired(true),
  )
  .addStringOption(option =>
    option
      .setName("format")
      .setDescription("Preferred format for the emojis. Default is png.")
      .addChoices([
        { name: "png", value: "png" },
        { name: "jpg", value: "jpg" },
        { name: "webp", value: "webp" },
      ])
      .setRequired(false),
  )
  .addBooleanOption(option =>
    option
      .setName("animated")
      .setDescription("Whether to include animated emojis as gif. Default is true.")
      .setRequired(false),
  )
  .addBooleanOption(option =>
    option
      .setName("normalize")
      .setDescription("Will attempt to normalize emoji names to lowercase with hyphens. Default is false.")
      .setRequired(false),
  )
  .handler(async ({ interaction }) => {
    await interaction.deferReply();

    const input = interaction.options.getString("input", true);
    const format = interaction.options.getString("format") ?? "png";
    const animated = interaction.options.getBoolean("animated") ?? true;
    const normalizeNames = interaction.options.getBoolean("normalize") ?? false;

    const parsedEmojis = parseEmojis(input, {
      nameMut: normalizeNames ? alphanumericWithHyphens : name => name,
      allowGif: animated,
      preferExt: format,
    });
    if (parsedEmojis.length === 0) {
      return interaction.editReply(Embed.error("No downloadable emojis found in the input."));
    }

    const emojis = await downloadEmojis({
      emojis: parsedEmojis,
      progress: throttleLatest(async progress => interaction.editReply(downloadProgressMessage(progress)), 250),
    });

    await wait(1000); // allow last progress message to be seen

    const buffer = await zipToBuffer((zip) => {
      for (const emoji of emojis.success) {
        zip.addBuffer(emoji.data, `${emoji.name}.${emoji.ext}`, {
          compress: true,
          compressionLevel: 7,
        });
      }
    });

    return interaction.editReply(downloadProgressMessage(emojis, buffer));
  });

function downloadProgressMessage({ current, total, failed, success }: DownloadProgress, buffer?: Buffer) {
  const progressRatio = total === 0 ? 1.0 : current / total;
  const header = [
    progressRatio === 1.0 ? buffer ? "**Emojis Downloaded** <a:loader:1459686503348174950>" : "**Archiving Emojis** <a:loader:1459686503348174950>" : `**Downloading Emojis**   ${inlineCode(`${current} / ${total}`)}`,
    buffer ? `${inlineCode(`${total} requested`)}   ${inlineCode(`${success.length} succeeded`)}   ${inlineCode(`${failed.length} failed`)}` : undefined,
  ].filter((row): row is string => row !== undefined);
  const footer = failed.length > 0
    ? [
        `-# Some Emojis Failed To Download:\n${codeBlock(failed.map(e => inlineCode(e.originalInput)).join(", "))}`,
      ]
    : undefined;

  if (!buffer) {
    return createProgressMessage({
      progress: progressRatio,
      header,
      footer,
    });
  }

  const time = new Date();
  return createFileMessage({
    attachment: new AttachmentBuilder(buffer, {
      name: `emojis-${time.getTime()}.zip`,
      description: `Contains ${success.length} emojis requested for download at ${time.toLocaleString()}`,
    }),
    header,
    footer,
  });
}

interface DownloadProgress {
  total: number;
  current: number;
  success: EmojiMetaWithData[];
  failed: EmojiMeta[];
}
interface EmojiMetaWithData extends EmojiMeta {
  data: Buffer;
}
async function downloadEmojis({
  emojis,
  progress,
}: {
  emojis: EmojiMeta[];
  progress: (progress: DownloadProgress) => Promise<unknown>;
}): Promise<DownloadProgress> {
  const success: EmojiMetaWithData[] = [];
  const failed: EmojiMeta[] = [];

  const download = pThrottle({
    limit: 5,
    interval: 1000,
  });

  await Promise.allSettled(emojis.map(download(async (emoji) => {
    try {
      const response = await fetch(emoji.url);
      if (response.ok) {
        success.push({
          ...emoji,
          data: Buffer.from(await response.arrayBuffer()),
        });
      }
      else {
        throw new Error(`Failed to download emoji ${emoji.id}: ${response.status} ${response.statusText}`);
      }
    }
    catch {
      failed.push(emoji);
    }
    finally {
      await progress({ total: emojis.length, current: success.length + failed.length, success, failed }).catch(() => {
        // ignore progress errors
      });
    }
  })));

  return {
    total: emojis.length,
    current: success.length + failed.length,
    success,
    failed,
  };
}

interface EmojiMeta {
  originalInput: string;
  id: Snowflake;
  name: string;
  url: string;
  ext: string;
}
type EmojiNameMut = (name: string) => string;
function parseEmojis(input: string, {
  preferExt,
  allowGif,
  nameMut,
}: {
  preferExt: string;
  allowGif: boolean;
  nameMut: EmojiNameMut;
}): EmojiMeta[] {
  const emojis: EmojiMeta[] = [];
  const names: Record<string, number> = {};

  const parts = input.trim().match(/<a?:\w+:\d+>/g)?.filter(Boolean) ?? [];
  for (const part of parts) {
    const parsed = parseEmoji(part.trim());
    if (parsed === null || parsed.id === undefined) {
      continue;
    }

    let name = nameMut(parsed.name ?? parsed.id);
    const count = names[name] ?? 0;
    names[name] = count + 1;

    if (count > 0) {
      name = `${name}-${count + 1}`;
    }

    const ext = parsed.animated && allowGif ? "gif" : preferExt;
    const url = `https://cdn.discordapp.com/emojis/${parsed.id}.${ext}`;

    emojis.push({
      originalInput: part,
      id: parsed.id,
      name,
      url,
      ext,
    });
  }

  return emojis;
}

function alphanumericWithHyphens(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // Replace non-alphanumeric/non-hyphen with hyphen
    .replace(/-{2,}/g, "-") // Collapse multiple hyphens to single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
