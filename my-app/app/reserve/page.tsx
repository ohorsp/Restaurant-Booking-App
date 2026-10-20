import { Suspense } from "react";
import { connection } from "next/server";
import { readReservations } from "@/guest/book";
import { serveGuest, type Duration } from "@/guest/serve-guest";
import { ConfirmStep } from "./confirm-step";
import { ReservationScreens } from "./screens";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isDuration(value: string | undefined): value is Duration {
  return value === "1 hour" || value === "90 minutes" || value === "2 hours";
}

function isChange(value: string | undefined): value is "party size" | "duration" {
  return value === "party size" || value === "duration";
}

export default function ReservePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col gap-8">
          <h1 className="text-3xl font-semibold tracking-tight">Make a reservation</h1>
        </main>
      }
    >
      <Reservation searchParams={searchParams} />
    </Suspense>
  );
}

async function Reservation({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const query = await searchParams;
  const partySize = Number(first(query.partySize));
  const table = Number(first(query.table));
  const duration = first(query.duration);
  const change = first(query.change);
  const view = serveGuest({
    now: new Date(),
    reservations: readReservations(),
    action: {
      type: "reserve",
      partySize: Number.isInteger(partySize) ? partySize : undefined,
      duration: isDuration(duration) ? duration : undefined,
      day: first(query.day),
      start: first(query.start),
      table: Number.isInteger(table) ? table : undefined,
      change: isChange(change) ? change : undefined,
    },
  });

  if (view.screen === "confirm") {
    return <ConfirmStep view={view} />;
  }

  return <ReservationScreens view={view} />;
}