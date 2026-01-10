import process from "node:process";
import { cyan, gray } from "colorette";
import pino from "pino";
import pretty from "pino-pretty";
import { isDevelopment } from "@/env";

const level = process.env.LOG_LEVEL ?? (isDevelopment ? "debug" : "info");

export function formatStamp(date: Date | number | string): { date: string; time: string } {
  const d = date instanceof Date ? date : new Date(date);

  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    fractionalSecondDigits: 3,
    timeZoneName: "short",
  };

  const parts = new Intl.DateTimeFormat("en-US", opts).formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === t)?.value ?? "";

  // timezone abbrev (fallbacks if needed)
  let tz = parts.find(p => p.type === "timeZoneName")?.value ?? "";
  if (!/^[A-Z]{2,5}$/.test(tz)) {
    try {
      const p2 = new Intl.DateTimeFormat("en-US", { timeZoneName: "shortOffset" }).formatToParts(d);
      tz = p2.find(p => p.type === "timeZoneName")?.value ?? tz;
    }
    catch {
      const offMin = d.getTimezoneOffset();
      const sign = offMin > 0 ? "-" : "+";
      const abs = Math.abs(offMin);
      tz = `GMT${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
    }
  }

  const ms
    = parts.find(p => p.type === "fractionalSecond")?.value
      ?? String(d.getMilliseconds()).padStart(3, "0");

  return {
    date: `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}`,
    time: `${get("hour")}:${get("minute")}:${get("second")}.${ms} ${tz}`,
  };
}

function clearViewportKeepHistory() {
  if (!process.stdout.isTTY) {
    return;
  }
  // Move cursor to top-left, clear to end of screen (keeps scrollback intact)
  process.stdout.write("\x1B[H\x1B[0J");
}

function prettifier() {
  clearViewportKeepHistory();

  const { date, time } = formatStamp(new Date());
  // eslint-disable-next-line no-console
  console.log(
    gray("Using pretty logs, timestamps start from"),
    cyan(date),
    gray("@"),
    cyan(time),
  );

  return pretty({
    colorize: true,
    translateTime: "SYS:HH:MM:ss.l",
    ignore: "pid,hostname",
    singleLine: true,
  });
}
const destination = isDevelopment
  ? prettifier()
  : pino.destination(1); // stdout

function errSer(e: unknown) {
  return e instanceof Error ? pino.stdSerializers.err(e as any) : e;
}

export const logger = pino({
  level,
  redact: {
    paths: [
      "token",
      "authorization",
      "Authorization",
      "x-secret-key",
      "headers.authorization",
      "headers.Authorization",
      "headers.x-secret-key",
    ],
    remove: true,
  },
  serializers: {
    err: errSer,
    error: errSer,
    errs: (arr: unknown) => Array.isArray(arr) ? arr.map(errSer) : arr,
    errors: (arr: unknown) => Array.isArray(arr) ? arr.map(errSer) : arr,
  },
}, destination);

export type Logger = typeof logger;
