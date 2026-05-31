import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact thousands separators, e.g. 128000 -> "128,000". */
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

/**
 * Format a monetary cost. Costs from tokenizers are frequently tiny
 * (fractions of a cent), so we use enough significant digits to stay useful.
 */
export function formatCost(
  value: number | null | undefined,
  currency = "USD",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Pricing unavailable";
  }
  if (value === 0) return formatCurrency(0, currency);

  // Choose precision based on magnitude so sub-cent costs are still readable.
  const digits = value < 0.01 ? 6 : value < 1 ? 4 : 2;
  return formatCurrency(value, currency, digits);
}

function formatCurrency(value: number, currency: string, digits = 2): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.max(2, digits),
    }).format(value);
  } catch {
    // Unknown currency code — fall back to a plain number + suffix.
    return `${value.toFixed(Math.max(2, digits))} ${currency}`;
  }
}

/** Format a value already expressed in megabytes (e.g. 225.11 -> "225.1 MB"). */
export function formatMb(mb: number | null | undefined): string {
  if (mb === null || mb === undefined || Number.isNaN(mb)) return "—";
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

/** Count words in a string (whitespace-separated, ignores empty). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Copy text to clipboard with a graceful fallback for insecure contexts. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Make whitespace visible inside a token block, mirroring the OpenAI tokenizer.
 * Spaces become a middle dot and newlines become a visible ↵ + actual break.
 */
export function renderVisibleWhitespace(token: string): string {
  return token.replace(/ /g, "·").replace(/\n/g, "↵\n").replace(/\t/g, "⇥");
}
