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

const closedMessage =
  "Big Al's Pizza is closed. Dinner service is Tuesday to Saturday, 5:30 pm\u201310:30 pm.";

const waitMessage =
  "Average wait time is 20\u201360 minutes. Pay the balance at Big Al's Pizza.";

export type Base = "Regular" | "Gluten Free";

export type TakeawayLine = {
  name: string;
  quantity: number;
  base?: Base;
};

export type TakeawayGroup = {
  name: MenuGroup["name"];
  items: { name: string; price: string; bases: Base[] | null }[];
};

export type PlacedTakeawayOrder = {
  lines: TakeawayLine[];
  total: string;
  name: string;
  phone: string;
  message: string;
  notes?: string;
};

export type Allergen = "gluten" | "milk";

export type TakeawayView = {
  closed: string | null;
  groups: TakeawayGroup[];
  lines: TakeawayLine[];
  total: string;
  allergens: Allergen[];
  takeawayOrder: PlacedTakeawayOrder | null;
};

export type TakeawayAction =
  | { type: "takeaway" }
  | { type: "add-menu-item"; name: string; lines: TakeawayLine[]; base?: Base }
  | {
      type: "set-quantity";
      name: string;
      quantity: number;
      lines: TakeawayLine[];
      base?: Base;
    }
  | { type: "remove-line"; name: string; lines: TakeawayLine[]; base?: Base }
  | {
      type: "place-takeaway";
      lines: TakeawayLine[];
      name: string;
      phone: string;
      notes?: string;
    };

function duringDinnerService(now: Date): boolean {
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  const minutes = hour * 60 + Number(parts.minute);
  const openDay =
    parts.weekday === "Tue" ||
    parts.weekday === "Wed" ||
    parts.weekday === "Thu" ||
    parts.weekday === "Fri" ||
    parts.weekday === "Sat";
  return openDay && minutes >= 17 * 60 + 30 && minutes <= 22 * 60 + 30;
}

function menuItem(name: string): MenuItem | null {
  for (const group of menu) {
    for (const item of group.items) {
      if (item.name === name) return item;
    }
  }
  return null;
}

function regularPrice(name: string): number | null {
  const item = menuItem(name);
  return item === null ? null : Number(item.price.slice(1));
}

function withBase(name: string, quantity: number, base?: Base): TakeawayLine {
  if (menuItem(name)?.base === null) return { name, quantity };
  return { name, quantity, base: base === "Gluten Free" ? "Gluten Free" : "Regular" };
}

function orderTotal(lines: TakeawayLine[]): string {
  let sum = 0;
  for (const line of lines) {
    const price = regularPrice(line.name);
    if (price === null) continue;
    const each = line.base === "Gluten Free" ? price + 4 : price;
    sum += each * line.quantity;
  }
  return `$${sum}`;
}

const lineBases: Base[] = ["Regular", "Gluten Free"];

function orderGroups(): TakeawayGroup[] {
  return menu.map((group) => ({
    name: group.name,
    items: group.items.map((item) => ({
      name: item.name,
      price: item.price,
      bases: item.base === null ? null : lineBases,
    })),
  }));
}

function closedTakeaway(): TakeawayView {
  return {
    closed: closedMessage,
    groups: [],
    lines: [],
    total: "$0",
    allergens: [],
    takeawayOrder: null,
  };
}


function recordedBase(line: TakeawayLine): Base | undefined {
  if (line.base !== undefined) return line.base;
  if (menuItem(line.name)?.base === null) return undefined;
  return "Regular";
}

function addMenuItem(lines: TakeawayLine[], name: string, base?: Base): TakeawayLine[] {
  if (regularPrice(name) === null) return lines;
  const chosen = withBase(name, 1, base).base;
  if (!lines.some((line) => line.name === name && recordedBase(line) === chosen)) {
    return [...lines, withBase(name, 1, base)];
  }
  return lines.map((line) => {
    if (line.name !== name || recordedBase(line) !== chosen || line.quantity >= 10) return line;
    return withBase(name, line.quantity + 1, chosen);
  });
}

function setQuantity(
  lines: TakeawayLine[],
  name: string,
  quantity: number,
  base?: Base,
): TakeawayLine[] {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return lines;
  if (regularPrice(name) === null) return lines;
  const chosen = withBase(name, 1, base).base;
  if (!lines.some((line) => line.name === name && recordedBase(line) === chosen)) return lines;
  return lines.map((line) =>
    line.name === name && recordedBase(line) === chosen ? withBase(name, quantity, chosen) : line,
  );
}
function normalizeLine(line: TakeawayLine): TakeawayLine | null {
  if (regularPrice(line.name) === null) return null;
  if (!Number.isInteger(line.quantity) || line.quantity < 1) return null;
  return withBase(line.name, Math.min(line.quantity, 10), recordedBase(line));
}

function normalizeLines(lines: TakeawayLine[]): TakeawayLine[] {
  return lines.flatMap((line) => {
    const normalized = normalizeLine(line);
    return normalized === null ? [] : [normalized];
  });
}

function menuGroup(name: string): MenuGroup["name"] | null {
  for (const group of menu) {
    if (group.items.some((item) => item.name === name)) return group.name;
  }
  return null;
}

function basketAllergens(lines: TakeawayLine[]): Allergen[] {
  let gluten = false;
  let milk = false;
  for (const line of lines) {
    const group = menuGroup(line.name);
    const pizza = group === "Traditional pizzas" || group === "Italian pizzas";
    if (line.base === "Regular" && (pizza || group === "garlic bread")) gluten = true;
    if ((pizza && line.name !== "Marinara") || group === "garlic bread") milk = true;
  }
  const allergens: Allergen[] = [];
  if (gluten) allergens.push("gluten");
  if (milk) allergens.push("milk");
  return allergens;
}

function openTakeaway(lines: TakeawayLine[]): TakeawayView {
  const normalized = normalizeLines(lines);
  return {
    closed: null,
    groups: orderGroups(),
    lines: normalized,
    total: orderTotal(normalized),
    allergens: basketAllergens(normalized),
    takeawayOrder: null,
  };
}


function placeTakeaway(
  lines: TakeawayLine[],
  name: string,
  phone: string,
  notes?: string,
): TakeawayView {
  const normalized = normalizeLines(lines);
  const screen = openTakeaway(normalized);
  if (normalized.length === 0 || name === "" || phone === "") return screen;
  const takeawayOrder: PlacedTakeawayOrder = {
    lines: normalized,
    total: screen.total,
    name,
    phone,
    message: waitMessage,
  };
  if (notes !== undefined && notes.trim() !== "") takeawayOrder.notes = notes;
  return { ...screen, takeawayOrder };
}

// The Menu stays readable at any clock. Viewing it does not create a Takeaway Order.
export function serveGuest(input: {
  now: Date;
  action: { type: "view-menu" };
}): ViewMenu;
export function serveGuest(input: {
  now: Date;
  action: TakeawayAction;
}): TakeawayView;
export function serveGuest(input: {
  now: Date;
  reservations: Reservation[];
  action: ReserveAction;
}): CalendarView | StartsView | FloorView | ConfirmView | SuccessView | RefusedView;
export function serveGuest(input: {
  now: Date;
  reservations?: Reservation[];
  action: { type: "view-menu" } | TakeawayAction | ReserveAction;
}): ViewMenu | TakeawayView | CalendarView | StartsView | FloorView | ConfirmView | SuccessView | RefusedView {
  if (input.action.type === "view-menu") {
    return { menu, takeawayOrder: null };
  }

  if (input.action.type !== "reserve") {
    if (!duringDinnerService(input.now)) return closedTakeaway();
    if (input.action.type === "takeaway") return openTakeaway([]);
    if (input.action.type === "add-menu-item") {
      return openTakeaway(
        addMenuItem(input.action.lines, input.action.name, input.action.base),
      );
    }
    if (input.action.type === "remove-line") {
      const { name, lines, base } = input.action;
      const chosen = withBase(name, 1, base).base;
      return openTakeaway(
        lines.filter((line) => !(line.name === name && recordedBase(line) === chosen)),
      );
    }
    if (input.action.type === "place-takeaway") {
      return placeTakeaway(
        input.action.lines,
        input.action.name,
        input.action.phone,
        input.action.notes,
      );
    }
    return openTakeaway(
      setQuantity(
        input.action.lines,
        input.action.name,
        input.action.quantity,
        input.action.base,
      ),
    );
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
