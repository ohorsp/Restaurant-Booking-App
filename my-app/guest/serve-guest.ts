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

const closedMessage =
  "Big Al's Pizza is closed. Dinner service is Tuesday to Saturday, 5:30 pm\u201310:30 pm.";

const waitMessage =
  "Average wait time is 20\u201360 minutes. Pay the balance at Big Al's Pizza.";

export type TakeawayLine = {
  name: string;
  quantity: number;
};

export type TakeawayGroup = {
  name: MenuGroup["name"];
  items: { name: string; price: string }[];
};

export type PlacedTakeawayOrder = {
  lines: TakeawayLine[];
  total: string;
  name: string;
  phone: string;
  message: string;
};

export type TakeawayView = {
  closed: string | null;
  groups: TakeawayGroup[];
  lines: TakeawayLine[];
  total: string;
  takeawayOrder: PlacedTakeawayOrder | null;
};

type TakeawayAction =
  | { type: "takeaway" }
  | { type: "add-menu-item"; name: string; lines: TakeawayLine[] }
  | {
      type: "set-quantity";
      name: string;
      quantity: number;
      lines: TakeawayLine[];
    }
  | { type: "remove-line"; name: string; lines: TakeawayLine[] }
  | {
      type: "place-takeaway";
      lines: TakeawayLine[];
      name: string;
      phone: string;
    };

type GuestAction = { type: "view-menu" } | TakeawayAction;

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

function regularPrice(name: string): number | null {
  for (const group of menu) {
    for (const item of group.items) {
      if (item.name === name) return Number(item.price.slice(1));
    }
  }
  return null;
}

function orderTotal(lines: TakeawayLine[]): string {
  let sum = 0;
  for (const line of lines) {
    const price = regularPrice(line.name);
    if (price !== null) sum += price * line.quantity;
  }
  return `$${sum}`;
}

function orderGroups(): TakeawayGroup[] {
  return menu.map((group) => ({
    name: group.name,
    items: group.items.map((item) => ({ name: item.name, price: item.price })),
  }));
}

function closedTakeaway(): TakeawayView {
  return {
    closed: closedMessage,
    groups: [],
    lines: [],
    total: "$0",
    takeawayOrder: null,
  };
}


function addMenuItem(lines: TakeawayLine[], name: string): TakeawayLine[] {
  if (regularPrice(name) === null) return lines;
  if (!lines.some((line) => line.name === name)) {
    return [...lines, { name, quantity: 1 }];
  }
  return lines.map((line) => {
    if (line.name !== name || line.quantity >= 10) return line;
    return { name, quantity: line.quantity + 1 };
  });
}

function setQuantity(lines: TakeawayLine[], name: string, quantity: number): TakeawayLine[] {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return lines;
  if (regularPrice(name) === null) return lines;
  if (!lines.some((line) => line.name === name)) return lines;
  return lines.map((line) => (line.name === name ? { name, quantity } : line));
}
function openTakeaway(lines: TakeawayLine[]): TakeawayView {
  return {
    closed: null,
    groups: orderGroups(),
    lines,
    total: orderTotal(lines),
    takeawayOrder: null,
  };
}


function placeTakeaway(lines: TakeawayLine[], name: string, phone: string): TakeawayView {
  const screen = openTakeaway(lines);
  if (lines.length === 0 || name === "" || phone === "") return screen;
  return {
    ...screen,
    takeawayOrder: {
      lines,
      total: screen.total,
      name,
      phone,
      message: waitMessage,
    },
  };
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
  action: GuestAction;
}): ViewMenu | TakeawayView {
  if (input.action.type === "view-menu") {
    return { menu, takeawayOrder: null };
  }
  if (!duringDinnerService(input.now)) return closedTakeaway();
  if (input.action.type === "takeaway") return openTakeaway([]);
  if (input.action.type === "add-menu-item") {
    return openTakeaway(addMenuItem(input.action.lines, input.action.name));
  }
  if (input.action.type === "remove-line") {
    const { name, lines } = input.action;
    return openTakeaway(lines.filter((line) => line.name !== name));
  }
  if (input.action.type === "place-takeaway") {
    return placeTakeaway(input.action.lines, input.action.name, input.action.phone);
  }
  return openTakeaway(
    setQuantity(input.action.lines, input.action.name, input.action.quantity),
  );
}
