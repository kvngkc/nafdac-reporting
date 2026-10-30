import { randomInt } from "crypto";

// No 0/O/1/I to avoid confusion when read aloud or typed on a phone.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateTrackingCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `NR-${s}`;
}

export function normalizeTrackingCode(input: string): string {
  const v = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return v.startsWith("NR") ? `NR-${v.slice(2)}` : `NR-${v}`;
}
