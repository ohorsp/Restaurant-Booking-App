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

// The Menu stays readable at any clock. Viewing it does not create a Takeaway Order.
export function serveGuest(input: {
  now: Date;
  action: { type: "view-menu" };
}): ViewMenu {
  void input;
  return { menu, takeawayOrder: null };
}
