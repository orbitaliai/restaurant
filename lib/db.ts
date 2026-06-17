"server-only";

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type TableRecord = {
  id: number;
  name: string;
  capacity: number;
};

export type BookingRecord = {
  id: number;
  guest_name: string;
  guest_email: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  table_name: string;
  table_capacity: number;
  created_at: string;
};

export type HoursRecord = {
  weekday: number;
  day_name: string;
  open_time: string;
  close_time: string;
  is_closed: number;
};

export type MenuItemRecord = {
  id: number;
  category: string;
  name: string;
  description: string;
  price_cents: number;
};

export const menuCategories = [
  "Salads",
  "Antipasti",
  "Pizzas",
  "Pasta",
  "Meat",
  "Desserts",
  "Drinks",
];

const defaultMenuItems = [
  ["Salads", "Spring Salad", "Mixed greens, tomato, sweet corn, egg, and tuna", 890],
  ["Salads", "Napoli Salad", "Tomato, buffalo mozzarella, basil, olives, and oregano", 1090],
  ["Salads", "Caesar Salad", "Romaine, chicken, parmesan, croutons, and Caesar dressing", 1190],
  ["Salads", "Goat Cheese Salad", "Greens, warm goat cheese, walnuts, and balsamic glaze", 1250],
  ["Salads", "Burrata Salad", "Burrata, cherry tomatoes, rocket, pesto, and olive oil", 1390],
  ["Antipasti", "Dipu Chicken", "Crispy chicken bites with house dipping sauce", 890],
  ["Antipasti", "Garlic Bread", "Toasted bread with garlic butter, parsley, and mozzarella", 590],
  ["Antipasti", "Bruschetta Trio", "Tomato basil, tapenade, and ricotta with honey", 790],
  ["Antipasti", "Eggplant Parmesan", "Layered eggplant, tomato sauce, mozzarella, and parmesan", 1190],
  ["Antipasti", "Burrata with Pesto", "Creamy burrata with basil pesto and toasted focaccia", 1290],
  ["Antipasti", "Pate and Cheese Board", "Selection of pates, cheeses, preserves, and bread", 1290],
  ["Antipasti", "Fried Calamari", "Crisp calamari with lemon and garlic aioli", 1390],
  ["Pizzas", "Margherita Pizza", "Tomato, mozzarella, basil, and extra virgin olive oil", 990],
  ["Pizzas", "Prosciutto Pizza", "Tomato, mozzarella, cooked ham, and oregano", 1090],
  ["Pizzas", "Diavola Pizza", "Tomato, mozzarella, spicy salami, chili, and oregano", 1190],
  ["Pizzas", "Four Cheese Pizza", "Mozzarella, gorgonzola, provolone, and parmesan", 1290],
  ["Pizzas", "Capricciosa Pizza", "Ham, mushrooms, artichokes, olives, tomato, and mozzarella", 1390],
  ["Pizzas", "Napoli Pizza", "Tomato, mozzarella, anchovies, capers, olives, and oregano", 1290],
  ["Pizzas", "Vegetarian Pizza", "Seasonal vegetables, tomato, mozzarella, and basil", 1250],
  ["Pizzas", "Carbonara Pizza", "Mozzarella, pancetta, egg, parmesan, and black pepper", 1390],
  ["Pizzas", "Pizza Roma", "Tomato, mozzarella, ham, mushrooms, rocket, and parmesan", 1490],
  ["Pizzas", "Burrata Pizza", "Tomato, mozzarella, burrata, cherry tomatoes, and pesto", 1590],
  ["Pasta", "Spaghetti Bolognese", "Slow-cooked beef ragout and parmesan", 1190],
  ["Pasta", "Spaghetti Carbonara", "Pancetta, egg, pecorino, parmesan, and black pepper", 1250],
  ["Pasta", "Penne Arrabbiata", "Spicy tomato sauce, garlic, chili, and parsley", 1090],
  ["Pasta", "Tagliatelle Pesto", "Fresh basil pesto, pine nuts, parmesan, and olive oil", 1190],
  ["Pasta", "Four Cheese Gnocchi", "Potato gnocchi in a creamy four-cheese sauce", 1290],
  ["Pasta", "Lasagna al Forno", "Baked pasta with beef ragout, bechamel, and parmesan", 1390],
  ["Pasta", "Seafood Linguine", "Prawns, mussels, tomato, garlic, and white wine", 1590],
  ["Meat", "Milanese Escalope", "Breaded veal-style escalope with fries and lemon", 1390],
  ["Meat", "Chicken Parmigiana", "Breaded chicken with tomato sauce, mozzarella, and basil", 1490],
  ["Meat", "Vindaloo Chicken", "Spicy chicken vindaloo with rice", 1790],
  ["Meat", "Grilled Sirloin", "Sirloin steak from the grill with roasted potatoes", 2090],
  ["Meat", "Beef Tagliata", "Sliced beef, rocket, parmesan, cherry tomatoes, and balsamic", 2190],
  ["Desserts", "Tiramisu", "Mascarpone cream, coffee-soaked sponge, and cocoa", 650],
  ["Desserts", "Panna Cotta", "Vanilla cream with red berry coulis", 590],
  ["Desserts", "Chocolate Coulant", "Warm chocolate cake with vanilla ice cream", 690],
  ["Desserts", "Lemon Sorbet", "Refreshing lemon sorbet", 490],
  ["Desserts", "Pizza Nutella", "Sweet baked dough with Nutella and hazelnuts", 790],
  ["Drinks", "Half Bottle of Water", "Still water", 250],
  ["Drinks", "Sparkling Water", "Chilled sparkling mineral water", 290],
  ["Drinks", "Soft Drink", "Coca-Cola, Fanta, Sprite, or iced tea", 320],
  ["Drinks", "Beer", "Draft or bottled beer", 350],
  ["Drinks", "House Red Wine", "Glass of Italian-style house red", 390],
  ["Drinks", "House White Wine", "Glass of fresh house white", 390],
  ["Drinks", "Aperol Spritz", "Aperol, prosecco, soda, and orange", 750],
  ["Drinks", "Coffee", "Freshly brewed coffee", 140],
  ["Drinks", "Cappuccino", "Espresso with steamed milk", 250],
] satisfies Array<[string, string, string, number]>;

const originalSampleMenuNames = [
  "Albariño",
  "Basque Cheesecake",
  "Charred Octopus",
  "Chocolate Terrine",
  "House Vermouth",
  "Wild Mushroom Risotto",
];

const sparsePizzaRomaMenuNames = [
  "Caesar Salad",
  "Coffee",
  "Dipu Chicken",
  "Eggplant Parmesan",
  "Grilled Sirloin",
  "Half Bottle of Water",
  "Milanese Escalope",
  "Napoli Salad",
  "Pate and Cheese Board",
  "Spring Salad",
  "Vindaloo Chicken",
];

const dbPath = join(process.cwd(), "data", "restaurant.sqlite");
let db: DatabaseSync | undefined;

function database() {
  if (!db) {
    mkdirSync(dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA foreign_keys = ON");
    migrate(db);
    seed(db);
  }

  return db;
}

function migrate(client: DatabaseSync) {
  client.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL CHECK (capacity > 0)
    );

    CREATE TABLE IF NOT EXISTS operation_hours (
      weekday INTEGER PRIMARY KEY,
      day_name TEXT NOT NULL,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      is_closed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      party_size INTEGER NOT NULL CHECK (party_size > 0),
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE RESTRICT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (booking_date, booking_time, table_id)
    );
  `);
}

function seed(client: DatabaseSync) {
  const tablesCount = client
    .prepare("SELECT COUNT(*) as count FROM tables")
    .get() as { count: number };

  if (tablesCount.count === 0) {
    const insertTable = client.prepare(
      "INSERT INTO tables (name, capacity) VALUES (?, ?)",
    );
    [
      ["Window 1", 2],
      ["Window 2", 2],
      ["Garden 4", 4],
      ["Banquette 4", 4],
      ["Chef Table", 6],
      ["Family Table", 8],
    ].forEach(([name, capacity]) => insertTable.run(name, capacity));
  }

  const hoursCount = client
    .prepare("SELECT COUNT(*) as count FROM operation_hours")
    .get() as { count: number };

  if (hoursCount.count === 0) {
    const insertHours = client.prepare(
      "INSERT INTO operation_hours (weekday, day_name, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)",
    );
    [
      [0, "Sunday", "12:00", "21:00", 0],
      [1, "Monday", "00:00", "00:00", 1],
      [2, "Tuesday", "17:00", "22:00", 0],
      [3, "Wednesday", "17:00", "22:00", 0],
      [4, "Thursday", "17:00", "22:00", 0],
      [5, "Friday", "17:00", "23:00", 0],
      [6, "Saturday", "12:00", "23:00", 0],
    ].forEach((row) => insertHours.run(...row));
  }

  const menuCount = client
    .prepare("SELECT COUNT(*) as count FROM menu_items")
    .get() as { count: number };

  if (menuCount.count === 0) {
    insertDefaultMenu(client);
  } else if (menuCount.count === originalSampleMenuNames.length) {
    const menuNames = client
      .prepare("SELECT name FROM menu_items ORDER BY name")
      .all() as Array<{ name: string }>;
    const isOriginalSample = menuNames.every(
      (item, index) => item.name === originalSampleMenuNames[index],
    );

    if (isOriginalSample) {
      client.exec("DELETE FROM menu_items");
      insertDefaultMenu(client);
    }
  } else if (menuCount.count === sparsePizzaRomaMenuNames.length) {
    const menuNames = client
      .prepare("SELECT name FROM menu_items ORDER BY name")
      .all() as Array<{ name: string }>;
    const isSparsePizzaRomaMenu = menuNames.every(
      (item, index) => item.name === sparsePizzaRomaMenuNames[index],
    );

    if (isSparsePizzaRomaMenu) {
      client.exec("DELETE FROM menu_items");
      insertDefaultMenu(client);
    }
  }
}

function insertDefaultMenu(client: DatabaseSync) {
  const insertItem = client.prepare(
    "INSERT INTO menu_items (category, name, description, price_cents) VALUES (?, ?, ?, ?)",
  );
  defaultMenuItems.forEach((row) => insertItem.run(...row));
}

export function getTables() {
  return database()
    .prepare("SELECT id, name, capacity FROM tables ORDER BY capacity, name")
    .all() as TableRecord[];
}

export function getMenuItems() {
  return database()
    .prepare(
      `SELECT id, category, name, description, price_cents FROM menu_items
       ORDER BY
        CASE category
          WHEN 'Salads' THEN 1
          WHEN 'Antipasti' THEN 2
          WHEN 'Pizzas' THEN 3
          WHEN 'Pasta' THEN 4
          WHEN 'Meat' THEN 5
          WHEN 'Desserts' THEN 6
          WHEN 'Drinks' THEN 7
          ELSE 8
        END,
        name`,
    )
    .all() as MenuItemRecord[];
}

export function getHours() {
  return database()
    .prepare(
      "SELECT weekday, day_name, open_time, close_time, is_closed FROM operation_hours ORDER BY weekday",
    )
    .all() as HoursRecord[];
}

export function getBookings() {
  return database()
    .prepare(
      `SELECT bookings.id, guest_name, guest_email, party_size, booking_date, booking_time,
        tables.name AS table_name, tables.capacity AS table_capacity, created_at
       FROM bookings
       JOIN tables ON tables.id = bookings.table_id
       ORDER BY booking_date DESC, booking_time DESC`,
    )
    .all() as BookingRecord[];
}

export function getAvailableSlots(date: string, partySize: number) {
  if (!date || !Number.isFinite(partySize) || partySize <= 0) {
    return [];
  }

  const selectedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(selectedDate.valueOf())) {
    return [];
  }

  const hours = database()
    .prepare("SELECT * FROM operation_hours WHERE weekday = ?")
    .get(selectedDate.getDay()) as HoursRecord | undefined;

  if (!hours || hours.is_closed) {
    return [];
  }

  const slots: string[] = [];
  let cursor = toMinutes(hours.open_time);
  const close = toMinutes(hours.close_time);

  while (cursor <= close - 60) {
    const time = fromMinutes(cursor);
    const availableTable = findAvailableTable(date, time, partySize);

    if (availableTable) {
      slots.push(time);
    }

    cursor += 30;
  }

  return slots;
}

export function findAvailableTable(
  date: string,
  time: string,
  partySize: number,
) {
  return database()
    .prepare(
      `SELECT id, name, capacity FROM tables
       WHERE capacity >= ?
       AND id NOT IN (
        SELECT table_id FROM bookings WHERE booking_date = ? AND booking_time = ?
       )
       ORDER BY capacity ASC, name ASC
       LIMIT 1`,
    )
    .get(partySize, date, time) as TableRecord | undefined;
}

export function createBooking(input: {
  guestName: string;
  guestEmail: string;
  partySize: number;
  bookingDate: string;
  bookingTime: string;
}) {
  const table = findAvailableTable(
    input.bookingDate,
    input.bookingTime,
    input.partySize,
  );

  if (!table) {
    throw new Error("No table is available for that time.");
  }

  database()
    .prepare(
      `INSERT INTO bookings (guest_name, guest_email, party_size, booking_date, booking_time, table_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.guestName,
      input.guestEmail,
      input.partySize,
      input.bookingDate,
      input.bookingTime,
      table.id,
    );
}

export function createTable(name: string, capacity: number) {
  database()
    .prepare("INSERT INTO tables (name, capacity) VALUES (?, ?)")
    .run(name, capacity);
}

export function updateHours(
  weekday: number,
  openTime: string,
  closeTime: string,
  isClosed: boolean,
) {
  database()
    .prepare(
      "UPDATE operation_hours SET open_time = ?, close_time = ?, is_closed = ? WHERE weekday = ?",
    )
    .run(openTime, closeTime, isClosed ? 1 : 0, weekday);
}

export function createMenuItem(input: {
  category: string;
  name: string;
  description: string;
  priceCents: number;
}) {
  database()
    .prepare(
      "INSERT INTO menu_items (category, name, description, price_cents) VALUES (?, ?, ?, ?)",
    )
    .run(input.category, input.name, input.description, input.priceCents);
}

export function getDashboardStats() {
  const client = database();
  const totals = client
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM bookings) AS bookings,
        (SELECT COUNT(*) FROM tables) AS tables,
        (SELECT COUNT(*) FROM menu_items) AS menuItems`,
    )
    .get() as { bookings: number; tables: number; menuItems: number };

  const nextBookings = client
    .prepare(
      `SELECT bookings.id, guest_name, guest_email, party_size, booking_date, booking_time,
        tables.name AS table_name, tables.capacity AS table_capacity, created_at
       FROM bookings
       JOIN tables ON tables.id = bookings.table_id
       WHERE booking_date >= date('now')
       ORDER BY booking_date ASC, booking_time ASC
       LIMIT 5`,
    )
    .all() as BookingRecord[];

  return { totals, nextBookings };
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
