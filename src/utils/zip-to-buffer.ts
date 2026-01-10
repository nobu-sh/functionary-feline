import { Buffer } from "node:buffer";
import { ZipFile } from "yazl";

export async function zipToBuffer(
  build: (zip: ZipFile) => void,
): Promise<Buffer> {
  const zip = new ZipFile();

  const chunks: Buffer[] = [];

  zip.outputStream.on("data", (chunk) => {
    chunks.push(chunk);
  });

  const done = new Promise<Buffer>((resolve, reject) => {
    zip.outputStream.once("end", () => {
      resolve(Buffer.concat(chunks));
    });
    zip.outputStream.once("error", reject);
  });

  build(zip);
  zip.end();

  return done;
}
