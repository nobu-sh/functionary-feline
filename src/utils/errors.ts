import { randomBytes } from "node:crypto";

export function createErrorTraceCode(): string {
  return randomBytes(16).toString("hex");
}
