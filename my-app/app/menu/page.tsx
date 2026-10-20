import Link from "next/link";
import { Button } from "@/components/ui/button";
import { serveGuest } from "@/guest/serve-guest";

// Viewing the Menu does not depend on the clock. A fixed instant stays prerenderable.
const menuClock = new Date(0);

export default function MenuPage() {
  const view = serveGuest({
    now: menuClock,
    action: { type: "view-menu" },
  });

  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="h-12 w-fit px-4 text-base"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Back
        </Button>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Big Al&apos;s Pizza</p>
          <h1 className="text-3xl font-semibold tracking-tight">Menu</h1>
        </div>
      </header>
      {view.menu.map((group) => (
        <section key={group.name} className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{group.name}</h2>
          <ul className="flex flex-col">
            {group.items.map((item) => (
              <li
                key={item.name}
                className="flex flex-col gap-1 border-b border-border py-3"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.price}</span>
                </div>
                {item.base ? (
                  <p className="text-sm text-muted-foreground">{item.base}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
