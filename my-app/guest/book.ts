import type { Reservation } from "./serve-guest.ts";

const reservations: Reservation[] = [];

let pending: Promise<void> = Promise.resolve();

export function readReservations(): Reservation[] {
  return reservations;
}

export function saveReservation(reservation: Reservation): void {
  reservations.push(reservation);
}

export function withReservations<T>(use: (saved: Reservation[]) => T): Promise<T> {
  const result = pending.then(() => use(reservations));
  pending = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}