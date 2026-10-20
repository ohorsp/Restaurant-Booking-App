import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { serveGuest } from "@/guest/serve-guest";
import { TakeawayOrder } from "./takeaway-order";

export default function TakeawayPage() {
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
          <h1 className="text-3xl font-semibold tracking-tight">Takeaway order</h1>
        </div>
      </header>
      <Suspense fallback={null}>
        <TakeawayNow />
      </Suspense>
    </main>
  );
}

async function TakeawayNow() {
  await connection();
  const view = serveGuest({
    now: new Date(),
    action: { type: "takeaway" },
  });

  if (view.closed) {
    return <p>{view.closed}</p>;
  }

  return <TakeawayOrder initial={view} />;
}
