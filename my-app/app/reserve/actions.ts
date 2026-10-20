"use server";

import { saveReservation, withReservations } from "@/guest/book";
import {
  serveGuest,
  type Duration,
  type ReserveView,
} from "@/guest/serve-guest";

function isDuration(value: string): value is Duration {
  return value === "1 hour" || value === "90 minutes" || value === "2 hours";
}

export async function submitReservation(
  _previous: ReserveView | null,
  formData: FormData,
): Promise<ReserveView> {
  const durationValue = String(formData.get("duration") ?? "");
  const partySize = Number(formData.get("partySize"));
  const table = Number(formData.get("table"));
  const action = {
    type: "reserve" as const,
    partySize: Number.isInteger(partySize) ? partySize : undefined,
    duration: isDuration(durationValue) ? durationValue : undefined,
    day: String(formData.get("day") ?? ""),
    start: String(formData.get("start") ?? ""),
    table: Number.isInteger(table) ? table : undefined,
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };

  return withReservations((saved) => {
    const view = serveGuest({
      now: new Date(),
      reservations: saved,
      action,
    });

    if (view.screen === "success") {
      saveReservation(view.reservation);
    }

    return view;
  });
}