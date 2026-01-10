import { resolve } from "node:path";
import process from "node:process";
import { config } from "dotenv";
import Zod from "zod";

export const ExecutionRoot = resolve(process.cwd());
export const EnvFilePaths = [
  resolve(ExecutionRoot, ".env"),
  resolve(ExecutionRoot, ".env.local"),
];
if (typeof process.env.NODE_ENV === "string") {
  EnvFilePaths.push(
    resolve(ExecutionRoot, ".env.development"),
    resolve(ExecutionRoot, ".env.development.local"),
  );
}

function serverOnly<T extends Zod.ZodType<any>>(type: T): T {
  if (typeof window === "undefined")
    return type;
  return Zod.undefined({
    error: "server-only variable!",
  }) as unknown as T;
}

function parseEnvironment<T extends Zod.ZodType<any>>(
  type: T,
  environment: () => Record<keyof Zod.infer<T>, string | undefined>,
): Zod.infer<T> {
  try {
    return type.parse(environment());
  }
  catch (reason) {
    if (reason instanceof Zod.ZodError) {
      const message = reason.issues[0]
        ? `${reason.issues[0].message}: "${reason.issues[0].path.join(".")}"`
        : reason.message;

      throw new TypeError(message);
    }

    throw reason;
  }
}

// ANCHOR - Environment Schema
export const EnvironmentSchema = Zod.object({
  environment: Zod.enum(["development", "production"]).default("production"),
  discordAppId: Zod.string(),
  discordBotToken: serverOnly(Zod.string()),
  testGuildId: Zod.string().optional(),
  devIds: Zod.string().transform(val => val.split(",").map(id => id.trim())).default([]),
});

export type EnvironmentSchema = Zod.infer<typeof EnvironmentSchema>;

const Environment = parseEnvironment(EnvironmentSchema, () => {
  config({
    path: EnvFilePaths,
    override: true,
    quiet: true,
  });

  // ANCHOR - Map Environment Variables
  return {
    environment: process.env.NODE_ENV,
    discordAppId: process.env.DISCORD_APP_ID,
    discordBotToken: process.env.DISCORD_BOT_TOKEN,
    testGuildId: process.env.TEST_GUILD_ID,
    devIds: process.env.DEV_IDS,
  };
});

export const isDevelopment = Environment.environment === "development";
export const isProduction = Environment.environment === "production";

export { Environment };
export default Environment;
