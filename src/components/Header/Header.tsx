import { Github } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { HealthWidget } from "@/components/HealthWidget/HealthWidget";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHashRoute } from "@/hooks/useHashRoute";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "#/",
    label: "Tokenize",
    match: (r: string) =>
      !r.startsWith("/compare") && !r.startsWith("/pii") && !r.startsWith("/scan"),
  },
  { href: "#/compare", label: "Compare", match: (r: string) => r.startsWith("/compare") },
  { href: "#/pii", label: "Redact PII", match: (r: string) => r.startsWith("/pii") },
  { href: "#/scan", label: "Scan", match: (r: string) => r.startsWith("/scan") },
];

function MediumIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M0 0v32h32V0zm26.583 7.583l-1.714 1.646a.49.49 0 0 0-.193.479v12.089a.497.497 0 0 0 .193.484l1.672 1.646v.359h-8.427v-.359l1.734-1.688c.172-.172.172-.219.172-.479v-9.776l-4.828 12.26h-.651l-5.62-12.26v8.219c-.047.344.068.693.307.943l2.26 2.74v.359H5.087v-.359l2.26-2.74c.24-.25.349-.599.286-.943v-9.5A.816.816 0 0 0 7.362 10L5.357 7.583v-.365h6.229l4.818 10.568l4.234-10.568h5.943z" />
    </svg>
  );
}

export function Header() {
  const route = useHashRoute();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Mobile: logo + icons on row 1, nav scrolls on row 2. sm+: one row. */}
        <div className="flex flex-wrap items-center gap-x-2 py-2 sm:h-16 sm:flex-nowrap sm:gap-5 sm:py-0">
          {/* Logo — compact square icon on mobile, full banner on sm+ */}
          <a href="#/" aria-label="PromptTokenizer home" className="shrink-0">
            <img
              src="/favicon.svg"
              alt="PromptTokenizer logo"
              className="h-9 w-9 rounded-lg sm:hidden"
            />
            <img
              src="/banner.png"
              alt="PromptTokenizer logo"
              className="hidden h-14 w-auto rounded-xl sm:block"
            />
          </a>

          {/* Navigation — own scrollable row on mobile, inline beside the logo on sm+ */}
          <nav
            aria-label="Main"
            className="order-last -mx-4 flex basis-full items-center gap-1 overflow-x-auto px-4 pt-1 [scrollbar-width:none] sm:order-none sm:mx-0 sm:basis-auto sm:px-0 sm:pt-0 [&::-webkit-scrollbar]:hidden"
          >
            {NAV_ITEMS.map((item) => {
              const active = item.match(route);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
          <HealthWidget />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="GitHub repository"
              >
                <a
                  href="https://github.com/akgaur12"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Github className="h-[1.2rem] w-[1.2rem]" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View on GitHub</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label="Medium profile"
              >
                <a
                  href="https://medium.com/@ak_gaur"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <MediumIcon className="h-[1.45rem] w-[1.45rem]" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Read on Medium</TooltipContent>
          </Tooltip>
          <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
