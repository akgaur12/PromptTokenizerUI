import { Github } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { HealthWidget } from "@/components/HealthWidget/HealthWidget";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <img
            src="/banner.png"
            alt="PromptTokenizer logo"
            className="h-10 w-auto shrink-0 rounded-xl sm:h-14"
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
    </header>
  );
}
