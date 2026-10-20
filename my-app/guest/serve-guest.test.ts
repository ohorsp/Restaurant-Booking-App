import assert from "node:assert/strict";
import { test } from "node:test";
import { serveGuest } from "./serve-guest.ts";

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
    { name: "Pepperoni", price: "$19" },
  );
  assert.deepEqual(
    items.find((item) => item.name === "Water"),
    { name: "Water", price: "$3" },
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
  assert.deepEqual(pepperoni.lines, [{ name: "Pepperoni", quantity: 1 }]);
  assert.equal(pepperoni.total, "$19");

  const garlic = serveGuest({
    now,
    action: { type: "add-menu-item", name: "Cheesy Garlic Bread", lines: [] },
  });
  assert.deepEqual(garlic.lines, [{ name: "Cheesy Garlic Bread", quantity: 1 }]);
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
    { name: "Margherita", quantity: 1 },
    { name: "Pepperoni", quantity: 2 },
  ]);
  assert.equal(view.total, "$56");
});

test("a Guest can set a quantity from 1 to 10, and 3 or more does not ask", () => {
  const now = atSydney("2026-10-20T18:00:00");
  const three = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Hawaiian",
      quantity: 3,
      lines: [{ name: "Hawaiian", quantity: 1 }],
    },
  });
  assert.deepEqual(three.lines, [{ name: "Hawaiian", quantity: 3 }]);
  assert.equal(three.total, "$57");
  assert.equal("confirmation" in three, false);

  const six = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Hawaiian",
      quantity: 6,
      lines: [{ name: "Hawaiian", quantity: 5 }],
    },
  });
  assert.deepEqual(six.lines, [{ name: "Hawaiian", quantity: 6 }]);
  assert.equal(six.total, "$114");

  const ten = serveGuest({
    now,
    action: {
      type: "set-quantity",
      name: "Water",
      quantity: 10,
      lines: [{ name: "Water", quantity: 1 }],
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
  assert.deepEqual(view.lines, [{ name: "Pepperoni", quantity: 1 }]);
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
      { name: "Pepperoni", quantity: 2 },
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
