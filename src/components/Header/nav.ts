import { EyeOff, GitCompare, Hash, Minimize2, ShieldAlert, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  /** Full name, used by the desktop header. */
  label: string;
  /** Short name that fits under an icon in the mobile tab bar. */
  short: string;
  icon: LucideIcon;
  match: (route: string) => boolean;
}

const OTHER = ["/compare", "/compress", "/pii", "/scan"];

export const NAV_ITEMS: NavItem[] = [
  { href: "#/", label: "Tokenize", short: "Tokenize", icon: Hash, match: (r) => !OTHER.some((p) => r.startsWith(p)) },
  { href: "#/compare", label: "Compare", short: "Compare", icon: GitCompare, match: (r) => r.startsWith("/compare") },
  { href: "#/compress", label: "Compress", short: "Compress", icon: Minimize2, match: (r) => r.startsWith("/compress") },
  { href: "#/pii", label: "Redact PII", short: "Redact", icon: EyeOff, match: (r) => r.startsWith("/pii") },
  { href: "#/scan", label: "Scan", short: "Scan", icon: ShieldAlert, match: (r) => r.startsWith("/scan") },
];
