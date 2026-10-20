import type { Reservation } from "./serve-guest.ts";

const reservations: Reservation[] = [];

export function readReservations(): Reservation[] {
  return reservations;
}

export function saveReservation(reservation: Reservation): void {
  reservations.push(reservation);
}