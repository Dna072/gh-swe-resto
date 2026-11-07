/** Unambiguous 4-character Swish payment reference (no 0/O/1/I). */
const PIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateSwishPin(random: () => number = Math.random): string {
  let pin = "";
  for (let index = 0; index < 4; index += 1) {
    pin += PIN_ALPHABET[Math.floor(random() * PIN_ALPHABET.length)]!;
  }
  return pin;
}

export function isValidSwishPin(value: string): boolean {
  return /^[A-HJ-NP-Z2-9]{4}$/.test(value.trim().toUpperCase());
}

export function normalizeSwishPin(value: string): string {
  return value.trim().toUpperCase();
}
