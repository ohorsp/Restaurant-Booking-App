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

test("a fitting Table that overlaps a saved Reservation is red and a free fitting Table stays green", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [
      {
        table: 5,
        partySize: 2,
        duration: "90 minutes",
        start: "2026-10-23T07:00:00.000Z",
        name: "Alex Kim",
        phone: "0400 111 222",
      },
    ],
    action: {
      type: "reserve",
      partySize: 3,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
    },
  });

  expectScreen(view, "floor");
  assert.deepEqual(
    view.tables.find((table) => table.number === 5),
    { number: 5, seats: 4, row: "Middle", center: false, color: "red", choosable: false },
  );
  assert.deepEqual(
    view.tables.find((table) => table.number === 6),
    { number: 6, seats: 4, row: "Middle", center: false, color: "green", choosable: true },
  );
});

test("a red Table cannot be chosen", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [
      {
        table: 5,
        partySize: 2,
        duration: "90 minutes",
        start: "2026-10-23T07:00:00.000Z",
        name: "Alex Kim",
        phone: "0400 111 222",
      },
    ],
    action: {
      type: "reserve",
      partySize: 3,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 5,
    },
  });

  expectScreen(view, "floor");
  assert.equal(view.reservation, null);
  assert.equal(view.tables.find((table) => table.number === 5)?.choosable, false);
});

test("the first submit keeps the Table and the second Guest is refused", () => {
  const first = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 5,
      name: "Alex Kim",
      phone: "0400 111 222",
    },
  });

  expectScreen(first, "success");
  assert.equal(first.reservation.table, 5);

  const second = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [first.reservation],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 5,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });

  expectScreen(second, "refused");
  assert.equal(second.reservation, null);
  assert.equal(
    second.message,
    "Sorry, someone beat you to it! Try select another table.",
  );
});

test("after the first save, that Table is red for the overlapping interval", () => {
  const first = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 5,
      name: "Alex Kim",
      phone: "0400 111 222",
    },
  });
  expectScreen(first, "success");

  const floor = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [first.reservation],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
    },
  });

  expectScreen(floor, "floor");
  assert.equal(floor.tables.find((table) => table.number === 5)?.color, "red");
  assert.equal(floor.tables.find((table) => table.number === 5)?.choosable, false);
});

test("a submit for a different Table still succeeds", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [
      {
        table: 5,
        partySize: 2,
        duration: "90 minutes",
        start: "2026-10-23T07:00:00.000Z",
        name: "Alex Kim",
        phone: "0400 111 222",
      },
    ],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 6,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });

  expectScreen(view, "success");
  assert.equal(view.reservation.table, 6);
  assert.equal(view.tableName, "Table 6");
});

test("the next Reservation may start when the earlier one ends", () => {
  const earlier = {
    table: 7,
    partySize: 2,
    duration: "90 minutes" as const,
    start: "2026-10-23T07:00:00.000Z",
    name: "Alex Kim",
    phone: "0400 111 222",
  };

  const stillTaken = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [earlier],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "1 hour",
      day: "2026-10-23",
      start: "7:00 pm",
      table: 7,
    },
  });
  expectScreen(stillTaken, "floor");
  assert.equal(stillTaken.tables.find((table) => table.number === 7)?.color, "red");
  assert.equal(stillTaken.tables.find((table) => table.number === 7)?.choosable, false);

  const backToBack = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [earlier],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "1 hour",
      day: "2026-10-23",
      start: "7:30 pm",
      table: 7,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });
  expectScreen(backToBack, "success");
  assert.equal(backToBack.start, "7:30 pm");
  assert.equal(backToBack.table, 7);
  assert.equal(backToBack.reservation.start, "2026-10-23T08:30:00.000Z");
});

test("the start list offers 6:30 pm and leaves out 6:00 pm when every fitting Table is taken at 6:00 pm", () => {
  const reservations = [
    {
      table: 10,
      partySize: 5,
      duration: "1 hour" as const,
      start: "2026-10-23T06:30:00.000Z",
      name: "Alex Kim",
      phone: "0400 111 222",
    },
    {
      table: 11,
      partySize: 5,
      duration: "2 hours" as const,
      start: "2026-10-23T06:30:00.000Z",
      name: "Alex Kim",
      phone: "0400 111 222",
    },
    {
      table: 12,
      partySize: 5,
      duration: "2 hours" as const,
      start: "2026-10-23T06:30:00.000Z",
      name: "Alex Kim",
      phone: "0400 111 222",
    },
  ];

  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations,
    action: {
      type: "reserve",
      partySize: 5,
      duration: "90 minutes",
      day: "2026-10-23",
    },
  });

  expectScreen(view, "starts");
  assert.equal(view.starts.includes("6:00 pm"), false);
  assert.equal(view.starts.includes("6:30 pm"), true);

  const blocked = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations,
    action: {
      type: "reserve",
      partySize: 5,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
    },
  });
  expectScreen(blocked, "starts");
});

test("a day whose fitting Tables are all taken shows 0 and does not open", () => {
  const reservations = [10, 11, 12].flatMap((table) => [
    {
      table,
      partySize: 5,
      duration: "2 hours" as const,
      start: "2026-10-23T06:30:00.000Z",
      name: "Alex Kim",
      phone: "0400 111 222",
    },
    {
      table,
      partySize: 5,
      duration: "2 hours" as const,
      start: "2026-10-23T08:30:00.000Z",
      name: "Alex Kim",
      phone: "0400 111 222",
    },
  ]);

  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations,
    action: { type: "reserve", partySize: 5, duration: "90 minutes" },
  });

  expectScreen(view, "calendar");
  assert.deepEqual(view.days[3], {
    date: "2026-10-23",
    label: "Friday 23 October",
    count: 0,
    selectable: false,
  });

  const opened = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations,
    action: {
      type: "reserve",
      partySize: 5,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "8:00 pm",
    },
  });
  expectScreen(opened, "calendar");
});

test("an open day counts only fitting Tables that still have a free start", () => {
  const reservations = [
    {
      table: 12,
      partySize: 5,
      duration: "2 hours" as const,
      start: "2026-10-23T06:30:00.000Z",
      name: "Alex Kim",
      phone: "0400 111 222",
    },
    {
      table: 12,
      partySize: 5,
      duration: "2 hours" as const,
      start: "2026-10-23T08:30:00.000Z",
      name: "Alex Kim",
      phone: "0400 111 222",
    },
  ];

  const view = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations,
    action: { type: "reserve", partySize: 5, duration: "90 minutes" },
  });

  expectScreen(view, "calendar");
  assert.equal(view.days[0].count, 3);
  assert.deepEqual(view.days[3], {
    date: "2026-10-23",
    label: "Friday 23 October",
    count: 2,
    selectable: true,
  });
});

test("changing the party size clears the chosen day, start, and Table", () => {
  const kept = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 4,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 7,
    },
  });
  expectScreen(kept, "confirm");
  assert.equal(kept.table, 7);
  assert.equal(kept.day, "2026-10-23");
  assert.equal(kept.start, "6:00 pm");

  const cleared = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 4,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 7,
      change: "party size",
    },
  });
  expectScreen(cleared, "calendar");
  assert.equal(cleared.partySize, 4);
  assert.equal(cleared.duration, "90 minutes");
  assert.equal(cleared.reservation, null);
});

test("changing the duration clears the chosen day, start, and Table", () => {
  const cleared = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "2 hours",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 7,
      change: "duration",
    },
  });

  expectScreen(cleared, "calendar");
  assert.equal(cleared.partySize, 2);
  assert.equal(cleared.duration, "2 hours");
  assert.equal(cleared.reservation, null);
});

const waitMessage =
  "Average wait time is 20\u201360 minutes. Pay the balance at Big Al's Pizza.";

const closedMessage =
  "Big Al's Pizza is closed. Dinner service is Tuesday to Saturday, 5:30 pm\u201310:30 pm.";

test("outside Dinner service, Takeaway order shows the closed message and places nothing", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T15:00:00"),
    action: { type: "takeaway" },
  });

  assert.equal(view.closed, closedMessage);
  assert.equal(view.takeawayOrder, null);
});

test("Dinner service is Tuesday to Saturday, 5:30 pm through 10:30 pm Sydney time", () => {
  const open = [
    "2026-10-20T17:30:00",
    "2026-10-20T22:30:00",
    "2026-10-21T19:00:00",
    "2026-10-22T17:30:00",
    "2026-10-23T22:30:00",
    "2026-10-24T18:00:00",
  ];
  const shut = [
    "2026-10-18T18:00:00",
    "2026-10-19T22:30:00",
    "2026-10-20T17:29:00",
    "2026-10-20T22:31:00",
    "2026-10-25T17:30:00",
  ];

  for (const local of open) {
    const view = serveGuest({
      now: atSydney(local),
      action: { type: "takeaway" },
    });
    assert.equal(view.closed, null, local);
    assert.equal(view.takeawayOrder, null, local);
  }

  for (const local of shut) {
    const view = serveGuest({
      now: atSydney(local),
      action: { type: "takeaway" },
    });
    assert.equal(view.closed, closedMessage, local);
    assert.equal(view.takeawayOrder, null, local);
  }
});

test("during Dinner service, Takeaway order lists Menu Items at Regular prices", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: { type: "takeaway" },
  });

  assert.equal(view.closed, null);
  assert.equal(view.takeawayOrder, null);
  assert.deepEqual(view.lines, []);
  assert.equal(view.total, "$0");
  assert.deepEqual(
    view.groups.map((group) => group.name),
    ["Traditional pizzas", "Italian pizzas", "garlic bread", "drinks"],
  );
  const items = view.groups.flatMap((group) => group.items);
  assert.deepEqual(
    items.find((item) => item.name === "Pepperoni"),
    { name: "Pepperoni", price: "$19", bases: ["Regular", "Gluten Free"] },
  );
  assert.deepEqual(
    items.find((item) => item.name === "Water"),
    { name: "Water", price: "$3", bases: null },
  );
});

test("a Guest can add a Menu Item at its Regular price", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const pepperoni = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Pepperoni", lines: [] },
  });
  assert.equal(pepperoni.closed, null);
  assert.equal(pepperoni.takeawayOrder, null);
  assert.deepEqual(pepperoni.lines, [{ name: "Pepperoni", quantity: 1, base: "Regular" }]);
  assert.equal(pepperoni.total, "$19");

  const garlic = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Cheesy Garlic Bread", lines: [] },
  });
  assert.deepEqual(garlic.lines, [
    { name: "Cheesy Garlic Bread", quantity: 1, base: "Regular" },
  ]);
  assert.equal(garlic.total, "$11");
});

test("adding the same Menu Item increases that line", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "add-menu-item",
      name: "Pepperoni",
      lines: [
        { name: "Margherita", quantity: 1 },
        { name: "Pepperoni", quantity: 1 },
      ],
    },
  });

  assert.deepEqual(view.lines, [
    { name: "Margherita", quantity: 1, base: "Regular" },
    { name: "Pepperoni", quantity: 2, base: "Regular" },
  ]);
  assert.equal(view.total, "$56");
});

test("a Guest can set a quantity from 1 to 10", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const two = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Hawaiian",
      quantity: 2,
      lines: [{ name: "Hawaiian", quantity: 1 }],
    },
  });
  assert.equal(two.confirmation, undefined);
  assert.deepEqual(two.lines, [{ name: "Hawaiian", quantity: 2, base: "Regular" }]);
  assert.equal(two.total, "$38");

  const askedThree = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Hawaiian",
      quantity: 3,
      lines: [{ name: "Hawaiian", quantity: 1 }],
    },
  });
  const three = serveGuest({
    now,
    action: {
      type: "confirm-quantity",
      name: "Hawaiian",
      quantity: 3,
      lines: askedThree.lines,
      answer: "yes",
    },
  });
  assert.deepEqual(three.lines, [{ name: "Hawaiian", quantity: 3, base: "Regular" }]);
  assert.equal(three.total, "$57");

  const askedSix = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Hawaiian",
      quantity: 6,
      lines: [{ name: "Hawaiian", quantity: 5 }],
    },
  });
  const six = serveGuest({
    now,
    action: {
      type: "confirm-quantity",
      name: "Hawaiian",
      quantity: 6,
      lines: askedSix.lines,
      answer: "yes",
    },
  });
  assert.deepEqual(six.lines, [{ name: "Hawaiian", quantity: 6, base: "Regular" }]);
  assert.equal(six.total, "$114");

  const askedTen = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Water",
      quantity: 10,
      lines: [{ name: "Water", quantity: 1 }],
    },
  });
  assert.equal(askedTen.confirmation?.question, "Are you sure you want 10 of Water?");
  const ten = serveGuest({
    now,
    action: {
      type: "confirm-quantity",
      name: "Water",
      quantity: 10,
      lines: askedTen.lines,
      answer: "yes",
    },
  });
  assert.deepEqual(ten.lines, [{ name: "Water", quantity: 10 }]);
  assert.equal(ten.total, "$30");

  const eleven = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Water",
      quantity: 11,
      lines: [{ name: "Water", quantity: 10 }],
    },
  });
  assert.equal(eleven.confirmation, undefined);
  assert.deepEqual(eleven.lines, [{ name: "Water", quantity: 10 }]);

  const zero = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Water",
      quantity: 0,
      lines: [{ name: "Water", quantity: 1 }],
    },
  });
  assert.equal(zero.confirmation, undefined);
  assert.deepEqual(zero.lines, [{ name: "Water", quantity: 1 }]);
});

test("adding the same Menu Item stops at a quantity of 10", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "add-menu-item",
      name: "Coke",
      lines: [{ name: "Coke", quantity: 10 }],
    },
  });
  assert.deepEqual(view.lines, [{ name: "Coke", quantity: 10 }]);
  assert.equal(view.total, "$40");
});

test("a Guest can remove a line", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "remove-line",
      name: "Coke",
      lines: [
        { name: "Pepperoni", quantity: 1 },
        { name: "Coke", quantity: 2 },
      ],
    },
  });
  assert.deepEqual(view.lines, [{ name: "Pepperoni", quantity: 1, base: "Regular" }]);
  assert.equal(view.total, "$19");
  assert.equal(view.takeawayOrder, null);
});

test("an empty basket cannot be sent", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "place-takeaway",
      lines: [],
      name: "Sam",
      phone: "0412 345 678",
    },
  });
  assert.equal(view.closed, null);
  assert.equal(view.takeawayOrder, null);
});

test("the success screen appears only after a name and phone number", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const lines = [{ name: "Pepperoni", quantity: 1 }];

  const blankName = serveGuest({
    now,
    action: {
      type: "place-takeaway",
      lines,
      name: "   ",
      phone: "0412 345 678",
    },
  });
  assert.equal(blankName.closed, null);
  assert.equal(blankName.takeawayOrder, null);

  const blankPhone = serveGuest({
    now,
    action: {
      type: "place-takeaway",
      lines,
      name: "Sam Taylor",
      phone: "   ",
    },
  });
  assert.equal(blankPhone.closed, null);
  assert.equal(blankPhone.takeawayOrder, null);

  const placed = serveGuest({
    now,
    action: {
      type: "place-takeaway",
      lines,
      name: "Sam Taylor",
      phone: "0412 345 678",
    },
  });
  assert.equal(placed.takeawayOrder?.name, "Sam Taylor");
  assert.equal(placed.takeawayOrder?.phone, "0412 345 678");
});

test("a Takeaway Order is placed only after a name and phone number, stored as typed", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const lines = [{ name: "Margherita", quantity: 1 }];
  const missingName = serveGuest({
    now,
    action: { type: "place-takeaway", lines, name: "", phone: "0412 345 678" },
  });
  assert.equal(missingName.takeawayOrder, null);

  const missingPhone = serveGuest({
    now,
    action: { type: "place-takeaway", lines, name: "Sam", phone: "" },
  });
  assert.equal(missingPhone.takeawayOrder, null);

  const placed = serveGuest({
    now,
    action: {
      type: "place-takeaway",
      lines: [
        { name: "Pepperoni", quantity: 2 },
        { name: "Water", quantity: 1 },
      ],
      name: "  Sam  ",
      phone: "04 1234 5678",
    },
  });
  assert.equal(placed.closed, null);
  assert.deepEqual(placed.takeawayOrder, {
    lines: [
      { name: "Pepperoni", quantity: 2, base: "Regular" },
      { name: "Water", quantity: 1 },
    ],
    total: "$41",
    name: "  Sam  ",
    phone: "04 1234 5678",
    message: waitMessage,
  });
});

test("a large Takeaway Order keeps the same wait sentence", () => {
  const view = serveGuest({
    now: atSydney("2026-10-24T22:30:00"),
    action: {
      type: "place-takeaway",
      lines: [{ name: "Meat Lovers", quantity: 8 }],
      name: "Alex",
      phone: "0400000000",
    },
  });
  assert.equal(view.takeawayOrder && view.takeawayOrder.total, "$184");
  assert.equal(view.takeawayOrder && view.takeawayOrder.message, waitMessage);
});

test("a pizza line has one Base, and Regular is the default", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: { type: "add-menu-item", name: "Diavola", lines: [] },
  });

  assert.deepEqual(view.lines, [{ name: "Diavola", quantity: 1, base: "Regular" }]);
  assert.equal(view.total, "$21");
});

test("a garlic-bread line has one Base, and Gluten Free adds $4", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: { type: "add-menu-item", name: "Garlic Bread", base: "Gluten Free", lines: [] },
  });

  assert.deepEqual(view.lines, [{ name: "Garlic Bread", quantity: 1, base: "Gluten Free" }]);
  assert.equal(view.total, "$12");
});

test("the same Menu Item on the other Base is a second line", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "add-menu-item",
      name: "Diavola",
      base: "Gluten Free",
      lines: [{ name: "Diavola", quantity: 1, base: "Regular" }],
    },
  });

  assert.deepEqual(view.lines, [
    { name: "Diavola", quantity: 1, base: "Regular" },
    { name: "Diavola", quantity: 1, base: "Gluten Free" },
  ]);
  assert.equal(view.total, "$46");
});

test("the same Menu Item and the same Base stay on one line, up to a quantity of 10", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const asked = serveGuest({
    now,
    action: {
      type: "add-menu-item",
      name: "Diavola",
      base: "Gluten Free",
      lines: [{ name: "Diavola", quantity: 2, base: "Gluten Free" }],
    },
  });
  assert.equal(asked.confirmation?.question, "Are you sure you want 3 of Diavola?");
  const increased = serveGuest({
    now,
    action: {
      type: "confirm-quantity",
      name: "Diavola",
      base: "Gluten Free",
      quantity: 3,
      lines: asked.lines,
      answer: "yes",
    },
  });
  assert.deepEqual(increased.lines, [{ name: "Diavola", quantity: 3, base: "Gluten Free" }]);
  assert.equal(increased.total, "$75");

  const capped = serveGuest({
    now,
    action: {
      type: "add-menu-item",
      name: "Cheesy Garlic Bread",
      base: "Gluten Free",
      lines: [{ name: "Cheesy Garlic Bread", quantity: 10, base: "Gluten Free" }],
    },
  });
  assert.deepEqual(capped.lines, [
    { name: "Cheesy Garlic Bread", quantity: 10, base: "Gluten Free" },
  ]);
  assert.equal(capped.total, "$150");
});

test("Coke, Diet Coke, Lemonade, Orange, and Water have no Base and keep their one price", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const drinks = [
    ["Coke", "$4"],
    ["Diet Coke", "$4"],
    ["Lemonade", "$4"],
    ["Orange", "$4"],
    ["Water", "$3"],
  ] as const;

  for (const [name, price] of drinks) {
    const view = serveGuest({
      now,
      action: { type: "add-menu-item", name, base: "Gluten Free", lines: [] },
    });
    assert.deepEqual(view.lines, [{ name, quantity: 1 }]);
    assert.equal(view.total, price);
  }
});

test("confirming 3 on one Base leaves the other Base", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const asked = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Pepperoni",
      base: "Regular",
      quantity: 3,
      lines: [
        { name: "Pepperoni", quantity: 1, base: "Regular" },
        { name: "Pepperoni", quantity: 1, base: "Gluten Free" },
      ],
    },
  });
  assert.equal(asked.confirmation?.question, "Are you sure you want 3 of Pepperoni?");
  assert.deepEqual(asked.lines, [
    { name: "Pepperoni", quantity: 1, base: "Regular" },
    { name: "Pepperoni", quantity: 1, base: "Gluten Free" },
  ]);

  const view = serveGuest({
    now,
    action: {
      type: "confirm-quantity",
      name: "Pepperoni",
      base: "Regular",
      quantity: 3,
      lines: asked.lines,
      answer: "yes",
    },
  });

  assert.deepEqual(view.lines, [
    { name: "Pepperoni", quantity: 3, base: "Regular" },
    { name: "Pepperoni", quantity: 1, base: "Gluten Free" },
  ]);
  assert.equal(view.total, "$80");
  assert.equal(view.confirmation, undefined);
});

test("the success screen shows the Base on each pizza and garlic-bread line", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "place-takeaway",
      lines: [
        { name: "Diavola", quantity: 3, base: "Gluten Free" },
        { name: "Garlic Bread", quantity: 1, base: "Regular" },
        { name: "Coke", quantity: 1 },
      ],
      name: "Sam",
      phone: "0412 345 678",
    },
  });

  assert.deepEqual(view.takeawayOrder, {
    lines: [
      { name: "Diavola", quantity: 3, base: "Gluten Free" },
      { name: "Garlic Bread", quantity: 1, base: "Regular" },
      { name: "Coke", quantity: 1 },
    ],
    total: "$87",
    name: "Sam",
    phone: "0412 345 678",
    message: waitMessage,
  });
});

test("pizzas and garlic breads offer Regular or Gluten Free, and drinks offer no Base", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: { type: "takeaway" },
  });
  const items = view.groups.flatMap((group) => group.items);

  assert.deepEqual(
    items.find((item) => item.name === "Diavola"),
    { name: "Diavola", price: "$21", bases: ["Regular", "Gluten Free"] },
  );
  assert.deepEqual(
    items.find((item) => item.name === "Garlic Bread"),
    { name: "Garlic Bread", price: "$8", bases: ["Regular", "Gluten Free"] },
  );
  assert.deepEqual(
    items.find((item) => item.name === "Cheesy Garlic Bread"),
    { name: "Cheesy Garlic Bread", price: "$11", bases: ["Regular", "Gluten Free"] },
  );
  for (const name of ["Coke", "Diet Coke", "Lemonade", "Orange", "Water"]) {
    const item = items.find((candidate) => candidate.name === name);
    assert.equal(item?.bases, null);
  }
});

test("removing one Base leaves the other Base of the same Menu Item", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "remove-line",
      name: "Diavola",
      base: "Gluten Free",
      lines: [
        { name: "Diavola", quantity: 1, base: "Regular" },
        { name: "Diavola", quantity: 2, base: "Gluten Free" },
      ],
    },
  });

  assert.deepEqual(view.lines, [{ name: "Diavola", quantity: 1, base: "Regular" }]);
  assert.equal(view.total, "$21");
});

test("a line of 3 Gluten Free Diavola costs the Diavola price plus $12", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const asked = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Diavola",
      base: "Gluten Free",
      quantity: 3,
      lines: [{ name: "Diavola", quantity: 1, base: "Gluten Free" }],
    },
  });
  assert.equal(asked.confirmation?.question, "Are you sure you want 3 of Diavola?");
  const view = serveGuest({
    now,
    action: {
      type: "confirm-quantity",
      name: "Diavola",
      base: "Gluten Free",
      quantity: 3,
      lines: asked.lines,
      answer: "yes",
    },
  });

  assert.deepEqual(view.lines, [{ name: "Diavola", quantity: 3, base: "Gluten Free" }]);
  assert.equal(view.total, "$75");
  assert.equal(view.confirmation, undefined);
});

test("increasing a line to 3 asks before that quantity is kept", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "set-quantity",
      name: "Pepperoni",
      quantity: 3,
      lines: [{ name: "Pepperoni", quantity: 1, base: "Regular" }],
    },
  });

  assert.equal(view.confirmation?.question, "Are you sure you want 3 of Pepperoni?");
  assert.deepEqual(view.lines, [{ name: "Pepperoni", quantity: 1, base: "Regular" }]);
  assert.equal(view.total, "$19");
  assert.equal(view.takeawayOrder, null);
});

test("yes keeps the quantity that was asked about", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const asked = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Pepperoni",
      quantity: 3,
      lines: [{ name: "Pepperoni", quantity: 1, base: "Regular" }],
    },
  });
  const kept = serveGuest({
    now,
    action: {
      type: "confirm-quantity",
      name: "Pepperoni",
      quantity: 3,
      base: "Regular",
      lines: asked.lines,
      answer: "yes",
    },
  });

  assert.equal(kept.confirmation, undefined);
  assert.deepEqual(kept.lines, [{ name: "Pepperoni", quantity: 3, base: "Regular" }]);
  assert.equal(kept.total, "$57");
});

test("no removes that whole line only", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const asked = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Pepperoni",
      base: "Regular",
      quantity: 3,
      lines: [
        { name: "Pepperoni", quantity: 2, base: "Regular" },
        { name: "Pepperoni", quantity: 1, base: "Gluten Free" },
        { name: "Coke", quantity: 1 },
      ],
    },
  });
  const declined = serveGuest({
    now,
    action: {
      type: "confirm-quantity",
      name: "Pepperoni",
      quantity: 3,
      base: "Regular",
      lines: asked.lines,
      answer: "no",
    },
  });

  assert.equal(declined.confirmation, undefined);
  assert.deepEqual(declined.lines, [
    { name: "Pepperoni", quantity: 1, base: "Gluten Free" },
    { name: "Coke", quantity: 1 },
  ]);
  assert.equal(declined.total, "$27");
});

test("increasing a line from 5 to 6 asks using 6 and the Menu Item name", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const asked = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Hawaiian",
      quantity: 6,
      lines: [{ name: "Hawaiian", quantity: 5, base: "Regular" }],
    },
  });

  assert.equal(asked.confirmation?.question, "Are you sure you want 6 of Hawaiian?");
  assert.deepEqual(asked.lines, [{ name: "Hawaiian", quantity: 5, base: "Regular" }]);
  assert.equal(asked.total, "$95");

  const kept = serveGuest({
    now,
    action: {
      type: "confirm-quantity",
      name: "Hawaiian",
      quantity: 6,
      base: "Regular",
      lines: asked.lines,
      answer: "yes",
    },
  });
  assert.deepEqual(kept.lines, [{ name: "Hawaiian", quantity: 6, base: "Regular" }]);
  assert.equal(kept.total, "$114");
  assert.equal(kept.confirmation, undefined);
});

test("adding another of the same Menu Item and Base asks before the line reaches 3", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "add-menu-item",
      name: "Pepperoni",
      base: "Regular",
      lines: [{ name: "Pepperoni", quantity: 2, base: "Regular" }],
    },
  });

  assert.equal(view.confirmation?.question, "Are you sure you want 3 of Pepperoni?");
  assert.deepEqual(view.lines, [{ name: "Pepperoni", quantity: 2, base: "Regular" }]);
  assert.equal(view.total, "$38");
});

test("decreasing a quantity does not ask", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "set-quantity",
      name: "Pepperoni",
      quantity: 5,
      lines: [{ name: "Pepperoni", quantity: 6, base: "Regular" }],
    },
  });

  assert.equal(view.confirmation, undefined);
  assert.deepEqual(view.lines, [{ name: "Pepperoni", quantity: 5, base: "Regular" }]);
  assert.equal(view.total, "$95");
});

test("a new line at quantity 1 does not ask", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: { type: "add-menu-item", name: "Pepperoni", lines: [] },
  });

  assert.equal(view.confirmation, undefined);
  assert.deepEqual(view.lines, [{ name: "Pepperoni", quantity: 1, base: "Regular" }]);
  assert.equal(view.total, "$19");
});

test("one Gluten Free Pepperoni beside two Regular Pepperoni does not ask", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "add-menu-item",
      name: "Pepperoni",
      base: "Gluten Free",
      lines: [{ name: "Pepperoni", quantity: 2, base: "Regular" }],
    },
  });

  assert.equal(view.confirmation, undefined);
  assert.deepEqual(view.lines, [
    { name: "Pepperoni", quantity: 2, base: "Regular" },
    { name: "Pepperoni", quantity: 1, base: "Gluten Free" },
  ]);
  assert.equal(view.total, "$61");
});

test("Garlic Bread and Cheesy Garlic Bread follow the same quantity rule", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const separate = serveGuest({
    now,
    action: {
      type: "add-menu-item",
      name: "Cheesy Garlic Bread",
      lines: [{ name: "Garlic Bread", quantity: 2, base: "Regular" }],
    },
  });
  assert.equal(separate.confirmation, undefined);
  assert.deepEqual(separate.lines, [
    { name: "Garlic Bread", quantity: 2, base: "Regular" },
    { name: "Cheesy Garlic Bread", quantity: 1, base: "Regular" },
  ]);
  assert.equal(separate.total, "$27");

  const otherBase = serveGuest({
    now,
    action: {
      type: "add-menu-item",
      name: "Garlic Bread",
      base: "Gluten Free",
      lines: [{ name: "Garlic Bread", quantity: 2, base: "Regular" }],
    },
  });
  assert.equal(otherBase.confirmation, undefined);
  assert.deepEqual(otherBase.lines, [
    { name: "Garlic Bread", quantity: 2, base: "Regular" },
    { name: "Garlic Bread", quantity: 1, base: "Gluten Free" },
  ]);
  assert.equal(otherBase.total, "$28");

  const garlic = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Garlic Bread",
      quantity: 3,
      lines: [{ name: "Garlic Bread", quantity: 1, base: "Regular" }],
    },
  });
  assert.equal(garlic.confirmation?.question, "Are you sure you want 3 of Garlic Bread?");
  assert.deepEqual(garlic.lines, [{ name: "Garlic Bread", quantity: 1, base: "Regular" }]);

  const cheesy = serveGuest({
    now,
    action: {
      type: "add-menu-item",
      name: "Cheesy Garlic Bread",
      lines: [{ name: "Cheesy Garlic Bread", quantity: 5, base: "Regular" }],
    },
  });
  assert.equal(cheesy.confirmation?.question, "Are you sure you want 6 of Cheesy Garlic Bread?");
  assert.deepEqual(cheesy.lines, [
    { name: "Cheesy Garlic Bread", quantity: 5, base: "Regular" },
  ]);
});

test("outside Dinner service, a Takeaway Order is not accepted", () => {
  const view = serveGuest({
    now: atSydney("2026-10-18T18:00:00"),
    action: {
      type: "place-takeaway",
      lines: [{ name: "Pepperoni", quantity: 1 }],
      name: "Sam",
      phone: "0412 345 678",
    },
  });
  assert.equal(view.closed, closedMessage);
  assert.equal(view.takeawayOrder, null);
  assert.deepEqual(view.lines, []);
});

test("a Takeaway Order has one optional notes field, and a Reservation has none", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const blank = serveGuest({
    now,
    action: {
      type: "place-takeaway",
      lines: [{ name: "Pepperoni", quantity: 1 }],
      name: "Sam",
      phone: "0412 345 678",
      notes: "   ",
    },
  });
  assert.ok(blank.takeawayOrder);
  assert.equal(Object.hasOwn(blank.takeawayOrder, "notes"), false);
  assert.equal(Object.hasOwn(blank.takeawayOrder.lines[0], "notes"), false);

  const written = serveGuest({
    now,
    action: {
      type: "place-takeaway",
      lines: [{ name: "Pepperoni", quantity: 1, base: "Regular" }],
      name: "Sam",
      phone: "0412 345 678",
      notes: "No onion",
    },
  });
  assert.equal(written.takeawayOrder?.notes, "No onion");
  assert.equal(Object.hasOwn(written.takeawayOrder?.lines[0] ?? {}, "notes"), false);

  const reservation = serveGuest({
    now: atSydney("2026-10-20T14:00:00"),
    reservations: [],
    action: {
      type: "reserve",
      partySize: 2,
      duration: "90 minutes",
      day: "2026-10-23",
      start: "6:00 pm",
      table: 7,
      name: "Sam",
      phone: "0412 345 678",
    },
  });
  expectScreen(reservation, "success");
  assert.equal(Object.hasOwn(reservation, "notes"), false);
  assert.equal(Object.hasOwn(reservation.reservation, "notes"), false);
});

test("an empty basket lists no allergens", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: { type: "takeaway" },
  });

  assert.deepEqual(view.allergens, []);
});

test("the basket lists gluten only for a pizza or garlic bread whose Base is Regular", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const regular = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Marinara", base: "Regular", lines: [] },
  });
  assert.deepEqual(regular.allergens, ["gluten"]);

  const glutenFree = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Marinara", base: "Gluten Free", lines: [] },
  });
  assert.deepEqual(glutenFree.allergens, []);

  const besideGlutenFree = serveGuest({
    now,
    action: {
      type: "add-menu-item",
      name: "Marinara",
      base: "Gluten Free",
      lines: [{ name: "Marinara", quantity: 2, base: "Regular" }],
    },
  });
  assert.deepEqual(besideGlutenFree.allergens, ["gluten"]);
});

test("the basket lists milk for every pizza except Marinara", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const withMilk = [
    "Cheese and Tomato",
    "Pepperoni",
    "Hawaiian",
    "Meat Lovers",
    "BBQ Chicken",
    "Supreme",
    "Margherita",
    "Diavola",
    "Quattro Formaggi",
    "Capricciosa",
    "Prosciutto",
  ];

  for (const name of withMilk) {
    const view = serveGuest({
      now,
      action: { type: "add-menu-item", name, base: "Gluten Free", lines: [] },
    });
    assert.deepEqual(view.allergens, ["milk"], name);
  }

  const regularPepperoni = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Pepperoni", base: "Regular", lines: [] },
  });
  assert.deepEqual(regularPepperoni.allergens, ["gluten", "milk"]);
});

test("the basket lists milk for Garlic Bread and Cheesy Garlic Bread", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const glutenFreeGarlic = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Garlic Bread", base: "Gluten Free", lines: [] },
  });
  assert.deepEqual(glutenFreeGarlic.allergens, ["milk"]);

  const glutenFreeCheesy = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Cheesy Garlic Bread", base: "Gluten Free", lines: [] },
  });
  assert.deepEqual(glutenFreeCheesy.allergens, ["milk"]);

  const regularGarlic = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Garlic Bread", base: "Regular", lines: [] },
  });
  assert.deepEqual(regularGarlic.allergens, ["gluten", "milk"]);

  const regularCheesy = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Cheesy Garlic Bread", lines: [] },
  });
  assert.deepEqual(regularCheesy.allergens, ["gluten", "milk"]);
});

test("drinks add neither gluten nor milk", () => {
  const now = atSydney("2026-10-20T18:00:00");
  for (const name of ["Coke", "Diet Coke", "Lemonade", "Orange", "Water"]) {
    const view = serveGuest({
      now,
      action: { type: "add-menu-item", name, lines: [] },
    });
    assert.deepEqual(view.allergens, [], name);
  }

  const withMarinara = serveGuest({
    now,
    action: {
      type: "add-menu-item",
      name: "Water",
      lines: [{ name: "Marinara", quantity: 1, base: "Gluten Free" }],
    },
  });
  assert.deepEqual(withMarinara.allergens, []);

  const withPepperoni = serveGuest({
    now,
    action: {
      type: "add-menu-item",
      name: "Coke",
      lines: [{ name: "Pepperoni", quantity: 1, base: "Regular" }],
    },
  });
  assert.deepEqual(withPepperoni.allergens, ["gluten", "milk"]);
});

test("nuts are not listed and there is no shared-kitchen warning", () => {
  const view = serveGuest({
    now: atSydney("2026-10-20T18:00:00"),
    action: {
      type: "place-takeaway",
      lines: [
        { name: "Supreme", quantity: 1, base: "Regular" },
        { name: "Pepperoni", quantity: 1, base: "Gluten Free" },
        { name: "Marinara", quantity: 1, base: "Regular" },
        { name: "Garlic Bread", quantity: 1, base: "Gluten Free" },
        { name: "Coke", quantity: 1 },
      ],
      name: "Sam",
      phone: "0412 345 678",
      notes: "Leave at the counter",
    },
  });

  assert.deepEqual(view.allergens, ["gluten", "milk"]);
  assert.equal(view.takeawayOrder?.notes, "Leave at the counter");
  assert.equal(view.takeawayOrder?.message, waitMessage);
  assert.equal(JSON.stringify(view).toLowerCase().includes("shared"), false);
});
