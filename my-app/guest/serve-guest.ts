export type MenuItem = {
  name: string;
  price: string;
  base: "Gluten Free for $4 more" | null;
};

export type MenuGroup = {
  name: "Traditional pizzas" | "Italian pizzas" | "garlic bread" | "drinks";
  items: MenuItem[];
};

export type ViewMenu = {
  menu: MenuGroup[];
  takeawayOrder: null;
};

const glutenFree = "Gluten Free for $4 more" as const;

const menu: MenuGroup[] = [
  {
    name: "Traditional pizzas",
    items: [
      { name: "Cheese and Tomato", price: "$16", base: glutenFree },
      { name: "Pepperoni", price: "$19", base: glutenFree },
      { name: "Hawaiian", price: "$19", base: glutenFree },
      { name: "Meat Lovers", price: "$23", base: glutenFree },
      { name: "BBQ Chicken", price: "$23", base: glutenFree },
      { name: "Supreme", price: "$23", base: glutenFree },
    ],
  },
  {
    name: "Italian pizzas",
    items: [
      { name: "Marinara", price: "$16", base: glutenFree },
      { name: "Margherita", price: "$18", base: glutenFree },
      { name: "Diavola", price: "$21", base: glutenFree },
      { name: "Quattro Formaggi", price: "$21", base: glutenFree },
      { name: "Capricciosa", price: "$23", base: glutenFree },
      { name: "Prosciutto", price: "$23", base: glutenFree },
    ],
  },
  {
    name: "garlic bread",
    items: [
      { name: "Garlic Bread", price: "$8", base: glutenFree },
      { name: "Cheesy Garlic Bread", price: "$11", base: glutenFree },
    ],
  },
  {
    name: "drinks",
    items: [
      { name: "Coke", price: "$4", base: null },
      { name: "Diet Coke", price: "$4", base: null },
      { name: "Lemonade", price: "$4", base: null },
      { name: "Orange", price: "$4", base: null },
      { name: "Water", price: "$3", base: null },
    ],
  },
];

export type Duration = "1 hour" | "90 minutes" | "2 hours";

export type Reservation = {
  table: number;
  partySize: number;
  duration: Duration;
  start: string;
  name: string;
  phone: string;
};

const partySizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const durations: Duration[] = ["1 hour", "90 minutes", "2 hours"];

type DiningTable = {
  number: number;
  seats: 2 | 4 | 6 | 10;
  row: "Front" | "Middle" | "Back";
  center: boolean;
};

const tables: DiningTable[] = [
  { number: 1, seats: 2, row: "Front", center: false },
  { number: 2, seats: 2, row: "Front", center: false },
  { number: 3, seats: 2, row: "Front", center: false },
  { number: 4, seats: 2, row: "Front", center: false },
  { number: 5, seats: 4, row: "Middle", center: false },
  { number: 6, seats: 4, row: "Middle", center: false },
  { number: 7, seats: 4, row: "Middle", center: false },
  { number: 8, seats: 4, row: "Middle", center: false },
  { number: 9, seats: 4, row: "Middle", center: false },
  { number: 10, seats: 6, row: "Back", center: false },
  { number: 11, seats: 6, row: "Back", center: false },
  { number: 12, seats: 10, row: "Back", center: true },
];

function chosenPartySize(partySize: number | undefined): number | null {
  if (partySize === undefined) return 2;
  return partySizes.includes(partySize) ? partySize : null;
}

function fittingTableCount(partySize: number): number {
  return tables.filter((table) => table.seats >= partySize).length;
}

export type CalendarDay = {
  date: string;
  label: string;
  count: number | null;
  selectable: boolean;
};

export type CalendarView = {
  screen: "calendar";
  partySize: number;
  partySizes: number[];
  duration: Duration;
  durations: Duration[];
  days: CalendarDay[];
  reservation: null;
};

export type StartsView = {
  screen: "starts";
  partySize: number;
  partySizes: number[];
  duration: Duration;
  durations: Duration[];
  day: string;
  dayLabel: string;
  starts: string[];
  reservation: null;
};

export type FloorTable = {
  number: number;
  seats: number;
  row: "Front" | "Middle" | "Back";
  center: boolean;
  color: "green";
  choosable: true;
};

export type FloorView = {
  screen: "floor";
  partySize: number;
  partySizes: number[];
  duration: Duration;
  durations: Duration[];
  day: string;
  dayLabel: string;
  start: string;
  tables: FloorTable[];
  reservation: null;
};

export type ConfirmView = {
  screen: "confirm";
  table: number;
  tableName: string;
  partySize: number;
  partySizes: number[];
  duration: Duration;
  durations: Duration[];
  day: string;
  start: string;
  date: string;
  reservation: null;
};

const cancelSentence =
  "If you need to cancel the reservation, please call Big Al's Pizza on 02 1234 1234.";

export type SuccessView = {
  screen: "success";
  table: number;
  tableName: string;
  partySize: number;
  duration: Duration;
  start: string;
  date: string;
  name: string;
  cancel: typeof cancelSentence;
  reservation: Reservation;
};

export type RefusedView = {
  screen: "refused";
  reservation: null;
};

export type ReserveView =
  | CalendarView
  | StartsView
  | FloorView
  | ConfirmView
  | SuccessView
  | RefusedView;

export type ReserveAction = {
  type: "reserve";
  partySize?: number;
  duration?: Duration;
  day?: string;
  start?: string;
  table?: number;
  name?: string;
  phone?: string;
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function sydneyCivil(instant: Date) {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function shiftCivil(year: number, month: number, day: number, days: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function weekdayIndex(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const DINNER_OPEN = 17 * 60 + 30;
const DINNER_CLOSE = 22 * 60 + 30;

function durationMinutes(duration: Duration): number {
  if (duration === "1 hour") return 60;
  if (duration === "90 minutes") return 90;
  return 120;
}

function chosenDuration(duration: Duration | undefined): Duration {
  return duration !== undefined && durations.includes(duration)
    ? duration
    : "90 minutes";
}

function sydneyInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const zonedAsUtc = (instant: number) => {
    const parts: Record<string, string> = {};
    for (const part of formatter.formatToParts(new Date(instant))) {
      if (part.type !== "literal") parts[part.type] = part.value;
    }
    return Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
  };
  const offset = zonedAsUtc(utcGuess) - utcGuess;
  return new Date(utcGuess - offset);
}

function hasLegalStart(
  year: number,
  month: number,
  day: number,
  duration: Duration,
  now: Date,
): boolean {
  const last = DINNER_CLOSE - durationMinutes(duration);
  for (let minutes = DINNER_OPEN; minutes <= last; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    if (sydneyInstant(year, month, day, hour, minute).getTime() > now.getTime()) {
      return true;
    }
  }
  return false;
}

function calendarDays(now: Date, duration: Duration, partySize: number): CalendarDay[] {
  const today = sydneyCivil(now);
  const days: CalendarDay[] = [];
  for (let offset = 0; offset <= 30; offset++) {
    const date = shiftCivil(today.year, today.month, today.day, offset);
    const weekday = weekdayIndex(date.year, date.month, date.day);
    const closed = weekday === 0 || weekday === 1;
    const bookable =
      !closed &&
      hasLegalStart(date.year, date.month, date.day, duration, now);
    days.push({
      date: isoDate(date.year, date.month, date.day),
      label: WEEKDAYS[weekday] + " " + date.day + " " + MONTHS[date.month - 1],
      count: closed ? null : bookable ? fittingTableCount(partySize) : 0,
      selectable: bookable,
    });
  }
  return days;
}

function formatTime(hour: number, minute: number): string {
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return hour12 + ":" + String(minute).padStart(2, "0") + " " + suffix;
}

function legalStarts(date: string, duration: Duration, now: Date): string[] {
  const [year, month, day] = date.split("-").map(Number);
  const last = DINNER_CLOSE - durationMinutes(duration);
  const starts: string[] = [];
  for (let minutes = DINNER_OPEN; minutes <= last; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    if (sydneyInstant(year, month, day, hour, minute).getTime() <= now.getTime()) {
      continue;
    }
    starts.push(formatTime(hour, minute));
  }
  return starts;
}

function startInstant(date: string, startLabel: string): string {
  const match = /^(\d{1,2}):(\d{2}) (am|pm)$/.exec(startLabel);
  if (!match) {
    throw new Error("Unknown start");
  }
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (match[3] === "pm" && hour !== 12) hour += 12;
  if (match[3] === "am" && hour === 12) hour = 0;
  const [year, month, day] = date.split("-").map(Number);
  return sydneyInstant(year, month, day, hour, minute).toISOString();
}

function identified(name: string | undefined, phone: string | undefined): boolean {
  return (
    typeof name === "string" &&
    name.trim() !== "" &&
    typeof phone === "string" &&
    phone.trim() !== ""
  );
}

// The Menu stays readable at any clock. Viewing it does not create a Takeaway Order.
export function serveGuest(input: {
  now: Date;
  action: { type: "view-menu" };
}): ViewMenu;
export function serveGuest(input: {
  now: Date;
  reservations: Reservation[];
  action: ReserveAction;
}): CalendarView | StartsView | FloorView | ConfirmView | SuccessView | RefusedView;
export function serveGuest(input: {
  now: Date;
  reservations?: Reservation[];
  action: { type: "view-menu" } | ReserveAction;
}): ViewMenu | CalendarView | StartsView | FloorView | ConfirmView | SuccessView | RefusedView {
  if (input.action.type === "view-menu") {
    return { menu, takeawayOrder: null };
  }

  const action = input.action;
  const partySize = chosenPartySize(action.partySize);
  if (partySize === null) {
    return { screen: "refused", reservation: null };
  }

  const duration = chosenDuration(action.duration);
  const days = calendarDays(input.now, duration, partySize);
  const day = days.find((candidate) => candidate.date === action.day);
  if (day?.selectable) {
    const starts = legalStarts(day.date, duration, input.now);
    if (action.start && starts.includes(action.start)) {
      const offered = tables
        .filter((table) => table.seats >= partySize)
        .map((table) => ({
          number: table.number,
          seats: table.seats,
          row: table.row,
          center: table.center,
          color: "green" as const,
          choosable: true as const,
        }));
      const chosen = offered.find((table) => table.number === action.table);
      if (chosen) {
        const name = action.name;
        const phone = action.phone;
        if (identified(name, phone) && name !== undefined && phone !== undefined) {
          return {
            screen: "success",
            table: chosen.number,
            tableName: "Table " + chosen.number,
            partySize,
            duration,
            start: action.start,
            date: day.label,
            name,
            cancel: cancelSentence,
            reservation: {
              table: chosen.number,
              partySize,
              duration,
              start: startInstant(day.date, action.start),
              name,
              phone,
            },
          };
        }

        return {
          screen: "confirm",
          table: chosen.number,
          tableName: "Table " + chosen.number,
          partySize,
          partySizes,
          duration,
          durations,
          day: day.date,
          start: action.start,
          date: day.label,
          reservation: null,
        };
      }

      return {
        screen: "floor",
        partySize,
        partySizes,
        duration,
        durations,
        day: day.date,
        dayLabel: day.label,
        start: action.start,
        tables: offered,
        reservation: null,
      };
    }

    return {
      screen: "starts",
      partySize,
      partySizes,
      duration,
      durations,
      day: day.date,
      dayLabel: day.label,
      starts,
      reservation: null,
    };
  }

  return {
    screen: "calendar",
    partySize,
    partySizes,
    duration,
    durations,
    days,
    reservation: null,
  };
}
