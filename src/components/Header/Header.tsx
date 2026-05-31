import { Github } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { HealthWidget } from "@/components/HealthWidget/HealthWidget";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <img
            src="/banner.png"
            alt="PromptTokenizer logo"
            className="h-14 w-70 shrink-0 rounded-xl"
          />
          {/* <div className="leading-tight">
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">
              PromptTokenizer
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Visualize and analyze LLM tokens
            </p>
          </div> */}
        </div>

        <div className="flex items-center gap-2">
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
