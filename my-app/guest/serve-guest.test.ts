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
