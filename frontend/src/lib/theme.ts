/** Shared colour helpers for diagram theming. */

export function hexToRgbChannels(hex: string): string {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6) return "15 18 28";
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return "15 18 28";
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function isDarkRgbChannels(channels: string): boolean {
  const parts = channels.split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return true;
  const [r, g, b] = parts;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum < 145;
}

export function ensureHash(hex: string): string {
  const h = hex.trim();
  return h.startsWith("#") ? h : `#${h}`;
}

function toHex2(n: number): string {
  return Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
}

/** Lighten (positive) or darken (negative) a hex colour. */
export function adjustHex(hex: string, deltaPerChannel: number): string {
  const h = ensureHash(hex).slice(1);
  const r = parseInt(h.slice(0, 2), 16) + deltaPerChannel;
  const g = parseInt(h.slice(2, 4), 16) + deltaPerChannel;
  const b = parseInt(h.slice(4, 6), 16) + deltaPerChannel;
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
}
