import assert from "node:assert/strict";
import { test } from "node:test";
import { serveGuest, type ReserveView } from "./serve-guest.ts";

function expectScreen<Screen extends ReserveView["screen"]>(
  view: ReserveView,
  screen: Screen,
): asserts view is Extract<ReserveView, { screen: Screen }> {
  assert.equal(view.screen, screen);
}

const glutenFree = "Gluten Free for $4 more";

const menu = [
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

function atSydney(local: string): Date {
  const [date, time] = local.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second] = time.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
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

test("a Guest can read the Menu grouped into Traditional pizzas, Italian pizzas, garlic bread, and drinks", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: { type: "view-menu" },
  });

  assert.equal(view.takeawayOrder, null);
  assert.deepEqual(view.menu, menu);
});

test("Make a reservation opens the calendar at party size 2 and 90 minutes", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: { type: "reserve" },
  });

  expectScreen(view, "calendar");
  assert.equal(view.partySize, 2);
  assert.deepEqual(view.partySizes, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(view.duration, "90 minutes");
  assert.deepEqual(view.durations, ["1 hour", "90 minutes", "2 hours"]);
  assert.equal(view.reservation, null);
});

test("a Guest can view the Menu on Sunday, Monday, and outside Dinner service without a Takeaway Order", () => {
  const closed = [
    atSydney("2026-10-18T12:00:00"),
    atSydney("2026-10-19T12:00:00"),
    atSydney("2026-10-20T10:00:00"),
    atSydney("2026-10-20T23:00:00"),
  ];

  for (const now of closed) {
    const view = serveGuest({ now, action: { type: "view-menu" } });
    assert.equal(view.takeawayOrder, null);
    assert.deepEqual(view.menu, menu);
  }
});

test("the calendar runs from today through 30 days ahead and keeps Sunday and Monday closed", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: { type: "reserve" },
  });

  expectScreen(view, "calendar");
  assert.equal(view.days.length, 31);
  assert.deepEqual(view.days[0], {
    date: "2026-10-20",
    label: "Tuesday 20 October",
    count: 12,
    selectable: true,
  });
  assert.deepEqual(view.days[5], {
    date: "2026-10-25",
    label: "Sunday 25 October",
    count: null,
    selectable: false,
  });
  assert.deepEqual(view.days[6], {
    date: "2026-10-26",
    label: "Monday 26 October",
    count: null,
    selectable: false,
  });
  assert.deepEqual(view.days[30], {
    date: "2026-11-19",
    label: "Thursday 19 November",
    count: 12,
    selectable: true,
  });
  assert.equal(
    view.days.some((day) => day.date === "2026-11-20"),
    false,
  );
});

test("a Guest at 9:15 pm who wants 2 hours sees no legal start left today", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T21:15:00"),
    reservations: [],
    action: { type: "reserve", duration: "2 hours" },
  });

  expectScreen(view, "calendar");
  assert.equal(view.duration, "2 hours");
  assert.deepEqual(view.days[0], {
    date: "2026-10-20",
    label: "Tuesday 20 October",
    count: 0,
    selectable: false,
  });
  assert.deepEqual(view.days[1], {
    date: "2026-10-21",
    label: "Wednesday 21 October",
    count: 12,
    selectable: true,
  });
});

test("start times run from 5:30 pm until the duration still ends by 10:30 pm", () => {
  const now = atSydney("2026-10-20T14:00:00");
  const hour = serveGuest({
    now,
    reservations: [],
    action: { type: "reserve", duration: "1 hour", day: "2026-10-23" },
  });
  expectScreen(hour, "starts");
  assert.deepEqual(hour.starts, [
    "5:30 pm",
    "6:00 pm",
    "6:30 pm",
    "7:00 pm",
    "7:30 pm",
    "8:00 pm",
    "8:30 pm",
    "9:00 pm",
    "9:30 pm",
  ]);

  const ninety = serveGuest({
    now,
    reservations: [],
    action: { type: "reserve", duration: "90 minutes", day: "2026-10-23" },
  });
  expectScreen(ninety, "starts");
  assert.deepEqual(ninety.starts, [
    "5:30 pm",
    "6:00 pm",
    "6:30 pm",
    "7:00 pm",
    "7:30 pm",
    "8:00 pm",
    "8:30 pm",
    "9:00 pm",
  ]);

  const twoHours = serveGuest({
    now,
    reservations: [],
    action: { type: "reserve", duration: "2 hours", day: "2026-10-23" },
  });
  expectScreen(twoHours, "starts");
  assert.deepEqual(twoHours.starts, [
    "5:30 pm",
    "6:00 pm",
    "6:30 pm",
    "7:00 pm",
    "7:30 pm",
    "8:00 pm",
    "8:30 pm",
  ]);
});

test("a start already in the past is left off the list", () => {
  const view = serveGuest({
    now: atSydney("2026-10-23T18:10:00"),
    reservations: [],
    action: { type: "reserve", duration: "90 minutes", day: "2026-10-23" },
  });

  expectScreen(view, "starts");
  assert.deepEqual(view.starts, [
    "6:30 pm",
    "7:00 pm",
    "7:30 pm",
    "8:00 pm",
    "8:30 pm",
    "9:00 pm",
  ]);
});

test("each open day counts only Tables with enough seats for the party", () => {
  const now = atSydney("2026-10-20T14:00:00");

  const partyOfThree = serveGuest({
    now,
    reservations: [],
    action: { type: "reserve", partySize: 3 },
  });
  expectScreen(partyOfThree, "calendar");
  assert.equal(partyOfThree.partySize, 3);
  assert.equal(partyOfThree.days[0].count, 8);

  const partyOfFive = serveGuest({
    now,
    reservations: [],
    action: { type: "reserve", partySize: 5 },
  });
  expectScreen(partyOfFive, "calendar");
  assert.equal(partyOfFive.partySize, 5);
  assert.equal(partyOfFive.days[0].count, 3);

  const alone = serveGuest({
    now,
    reservations: [],
    action: { type: "reserve", partySize: 1 },
  });
  expectScreen(alone, "calendar");
  assert.equal(alone.days[0].count, 12);

  const partyOfTen = serveGuest({
    now,
    reservations: [],
    action: { type: "reserve", partySize: 10 },
  });
  expectScreen(partyOfTen, "calendar");
  assert.equal(partyOfTen.days[0].count, 1);
});

test("a party of 3 sees fitting Tables in green and the 2-seat Tables stay hidden", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 3,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
    },
  });

  expectScreen(view, "floor");
  assert.equal(view.start, "6:00 pm");
  assert.deepEqual(view.tables, [
    { number: 5, seats: 4, row: "Middle", center: false, color: "green", choosable: true },
    { number: 6, seats: 4, row: "Middle", center: false, color: "green", choosable: true },
    { number: 7, seats: 4, row: "Middle", center: false, color: "green", choosable: true },
    { number: 8, seats: 4, row: "Middle", center: false, color: "green", choosable: true },
    { number: 9, seats: 4, row: "Middle", center: false, color: "green", choosable: true },
    { number: 10, seats: 6, row: "Back", center: false, color: "green", choosable: true },
    { number: 11, seats: 6, row: "Back", center: false, color: "green", choosable: true },
    { number: 12, seats: 10, row: "Back", center: true, color: "green", choosable: true },
  ]);
});

test("a party of 5 is offered only the 6-seat and 10-seat Tables", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 5,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
    },
  });

  expectScreen(view, "floor");
  assert.deepEqual(
    view.tables.map((table) => table.number),
    [10, 11, 12],
  );
});

test("a Guest alone can choose a 2-seat Table", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 1,
      duration: "1 hour",
      day: "2026-10-23",
      start: "5:30 pm",
    },
  });

  expectScreen(view, "floor");
  assert.equal(view.tables[0].number, 1);
  assert.equal(view.tables[0].seats, 2);
  assert.equal(view.tables[0].row, "Front");
  assert.equal(view.tables[0].color, "green");
  assert.equal(view.tables[0].choosable, true);
});

test("a party of 11 cannot reserve", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 11,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 12,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });

  expectScreen(view, "refused");
  assert.equal(view.reservation, null);
});

test("confirm names the Table, party size, duration, start, and date", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 7,
    },
  });

  expectScreen(view, "confirm");
  assert.equal(view.tableName, "Table 7");
  assert.equal(view.partySize, 2);
  assert.equal(view.duration, "90 minutes");
  assert.equal(view.start, "6:00 pm");
  assert.equal(view.date, "Friday 23 October");
  assert.equal(view.reservation, null);
});

test("success comes only after a name and phone number, stored as typed", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 7,
      name: "Sam  Taylor",
      phone: "0412 345 678",
    },
  });

  expectScreen(view, "success");
  assert.equal(view.tableName, "Table 7");
  assert.equal(view.partySize, 2);
  assert.equal(view.duration, "90 minutes");
  assert.equal(view.start, "6:00 pm");
  assert.equal(view.date, "Friday 23 October");
  assert.equal(view.name, "Sam  Taylor");
  assert.equal(
    view.cancel,
    "If you need to cancel the reservation, please call Big Al's Pizza on 02 1234 1234.",
  );
  assert.deepEqual(view.reservation, {
    table: 7,
    partySize: 2,
    duration: "90 minutes",
    start: "2026-10-23T07:00:00.000Z",
    name: "Sam  Taylor",
    phone: "0412 345 678",
  });
});

test("a Reservation is not saved without both a name and a phone number", () => {
  const action = {
    type: "reserve" as const,
    partySize: 2,
    duration: "90 minutes" as const,
    day: "2026-10-23",
    start: "6:00 pm",
    table: 7,
  };
  const noName = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: { ...action, name: "", phone: "0412 345 678" },
  });
  const noPhone = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: { ...action, name: "Sam Taylor", phone: "   " },
  });

  expectScreen(noName, "confirm");
  assert.equal(noName.reservation, null);
  expectScreen(noPhone, "confirm");
  assert.equal(noPhone.reservation, null);
});

test("success names a 1 hour duration and a 2 hour duration in those words", () => {
  const hour = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "1 hour",
      day: "2026-10-23",
      start: "9:30 pm",
      table: 1,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });
  expectScreen(hour, "success");
  assert.equal(hour.duration, "1 hour");
  assert.equal(hour.start, "9:30 pm");

  const twoHours = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "2 hours",
      day: "2026-10-23",
      start: "8:30 pm",
      table: 12,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });
  expectScreen(twoHours, "success");
  assert.equal(twoHours.duration, "2 hours");
  assert.equal(twoHours.start, "8:30 pm");
  assert.equal(twoHours.tableName, "Table 12");
});

test("the same phone number may hold more than one Reservation", () => {
  const now = atSydney("2026-10-20T14:00:00");
  const first = serveGuest({
    now,
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 7,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });
  if (first.reservation === null) {
    assert.fail("first Reservation was not saved");
  }
  const second = serveGuest({
    now,
    reservations: [first.reservation],
    action: {
      type: "reserve",
      partySize: 4,
      duration: "2 hours",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 12,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });

  expectScreen(first, "success");
  expectScreen(second, "success");
  assert.equal(first.reservation.table, 7);
  assert.equal(second.reservation && second.reservation.table, 12);
  assert.equal(second.reservation && second.reservation.phone, "0412 345 678");
});

test("a closed Sunday still offers a later Tuesday", () => {
  const now = atSydney("2026-10-18T15:00:00");
  const view = serveGuest({
    now,
    reservations: [],
    action: { type: "reserve" },
  });

  expectScreen(view, "calendar");
  assert.deepEqual(view.days[0], {
    date: "2026-10-18",
    label: "Sunday 18 October",
    count: null,
    selectable: false,
  });
  assert.deepEqual(view.days[1], {
    date: "2026-10-19",
    label: "Monday 19 October",
    count: null,
    selectable: false,
  });
  assert.deepEqual(view.days[2], {
    date: "2026-10-20",
    label: "Tuesday 20 October",
    count: 12,
    selectable: true,
  });

  const tuesday = serveGuest({
    now,
    reservations: [],
    action: { type: "reserve", day: "2026-10-20" },
  });
  expectScreen(tuesday, "starts");
  assert.equal(tuesday.starts[0], "5:30 pm");
});

test("Sunday cannot be selected", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      day: "2026-10-25",
      start: "6:00 pm",
      table: 1,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });

  expectScreen(view, "calendar");
  assert.equal(view.reservation, null);
});

test("a day with no legal start does not open", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T21:15:00"),
    reservations: [],
    action: { type: "reserve", duration: "2 hours", day: "2026-10-20" },
  });

  expectScreen(view, "calendar");
  assert.equal(view.days[0].selectable, false);
  assert.equal(view.days[0].count, 0);
});

test("at 9:15 pm a 1 hour Reservation can still start at 9:30 pm", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T21:15:00"),
    reservations: [],
    action: { type: "reserve", duration: "1 hour", day: "2026-10-20" },
  });

  expectScreen(view, "starts");
  assert.deepEqual(view.starts, ["9:30 pm"]);
});

test("a Guest can reserve before Dinner service and after it has ended", () => {
  const morning = serveGuest({
    now: atSydney("2026-10-20T08:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-20",
      start: "5:30 pm",
      table: 4,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });
  expectScreen(morning, "success");
  assert.equal(morning.date, "Tuesday 20 October");
  assert.equal(morning.start, "5:30 pm");

  const afterClose = serveGuest({
    now: atSydney("2026-10-20T23:30:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-21",
      start: "5:30 pm",
      table: 4,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });
  expectScreen(afterClose, "success");
  assert.equal(afterClose.date, "Wednesday 21 October");
});

test("the 30th day ahead can be reserved and the next day cannot", () => {
  const now = atSydney("2026-10-20T14:00:00");
  const last = serveGuest({
    now,
    reservations: [],
    action: {
      type: "reserve",
      day: "2026-11-19",
      start: "5:30 pm",
      table: 1,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });
  expectScreen(last, "success");
  assert.equal(last.date, "Thursday 19 November");

  const after = serveGuest({
    now,
    reservations: [],
    action: {
      type: "reserve",
      day: "2026-11-20",
      start: "5:30 pm",
      table: 1,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });
  expectScreen(after, "calendar");
  assert.equal(after.reservation, null);
});

test("a Table with fewer seats than the party is not confirmed", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 5,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 3,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });

  expectScreen(view, "floor");
  assert.equal(view.reservation, null);
  assert.deepEqual(
    view.tables.map((table) => table.number),
    [10, 11, 12],
  );
});
