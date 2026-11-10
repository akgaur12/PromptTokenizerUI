import { NAV_ITEMS } from "./nav";
import { useHashRoute } from "@/hooks/useHashRoute";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { cn } from "@/lib/utils";

/**
 * Mobile page tabs (below `lg`). Sits right under the header, pinned while
 * you scroll. It hides on scroll down and returns on scroll up.
 *
 * It's sticky (not fixed) and keeps its height when hidden — it only slides
 * and fades — so hiding never shifts the page or re-triggers the scroll.
 */
export function TabBar() {
  const route = useHashRoute();
  const { hidden, show } = useHideOnScroll();

  return (
    <nav
      aria-label="Pages"
      onFocus={show}
      className={cn(
        "sticky top-[calc(3.5rem+1px)] z-30 border-b border-border/60 bg-background/90 backdrop-blur transition-[transform,opacity,visibility] duration-200 ease-out supports-[backdrop-filter]:bg-background/80 motion-reduce:transition-none sm:top-[calc(4rem+1px)] lg:hidden",
        hidden && "invisible -translate-y-full opacity-0",
      )}
    >
      <ul className="mx-auto flex max-w-6xl px-2 sm:px-4">
        {NAV_ITEMS.map((item) => {
          const active = item.match(route);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <a
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[3.25rem] flex-col items-center justify-center gap-0.5 border-b-2 text-[11px] font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground active:text-foreground",
                )}
              >
                <Icon className="size-[1.15rem]" aria-hidden />
                {item.short}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
