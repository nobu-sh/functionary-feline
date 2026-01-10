export function createCustomId(...parts: string[] | string[][]): string {
  return parts.flat().join("::");
}

export function parseCustomId(customId: string): string[] {
  return customId.split("::");
}
