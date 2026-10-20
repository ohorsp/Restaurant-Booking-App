"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ConfirmView } from "@/guest/serve-guest";
import { submitReservation } from "./actions";
import { ConfirmDetails, ReservationScreens } from "./screens";

export function ConfirmStep({ view }: { view: ConfirmView }) {
  const [state, formAction, pending] = useActionState(submitReservation, null);
  if (state && state.screen !== "confirm") {
    return <ReservationScreens view={state} />;
  }

  const current = state?.screen === "confirm" ? state : view;

  return (
    <ConfirmDetails view={current}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="partySize" value={current.partySize} />
        <input type="hidden" name="duration" value={current.duration} />
        <input type="hidden" name="day" value={current.day} />
        <input type="hidden" name="start" value={current.start} />
        <input type="hidden" name="table" value={current.table} />
        <label className="flex flex-col gap-2 text-sm font-medium">
          Name
          <Input name="name" required autoComplete="name" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Phone number
          <Input name="phone" type="tel" required autoComplete="tel" />
        </label>
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
          Reserve
        </Button>
      </form>
    </ConfirmDetails>
  );
}