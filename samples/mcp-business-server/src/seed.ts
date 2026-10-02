import type { DB } from "./db.js";

// Fictional demo data for "Ember & Oak", a small coffee roastery with a web shop.
// Deterministic (seeded RNG) and anchored to "today", so "last week" questions always have answers.

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const FIRST = ["Anna", "Lukas", "Sophie", "Jonas", "Lena", "Felix", "Marie", "Paul", "Clara", "David", "Emma", "Noah", "Mia", "Elias", "Hannah", "Leon", "Laura", "Ben", "Julia", "Max"];
const LAST = ["Huber", "Gruber", "Wagner", "Bauer", "Moser", "Hofer", "Steiner", "Berger", "Fischer", "Weber", "Schmid", "Egger", "Mayr", "Brunner", "Lechner"];
const CITIES = ["Vienna", "Munich", "Salzburg", "Innsbruck", "Graz", "Berlin", "Hamburg", "Zurich", "Linz", "Cologne"];
const COMPANIES = ["Café Lindner", "Hotel Alpenblick", "Bürohaus Nord", "Bäckerei Moser", "Co-Work Graz", "Restaurant Seeblick"];

const PRODUCTS: [string, string, string, number, number, number][] = [
  ["EO-ESP-1K", "House Espresso Blend 1 kg", "Coffee", 2890, 64, 25],
  ["EO-ESP-250", "House Espresso Blend 250 g", "Coffee", 890, 140, 40],
  ["EO-ETH-250", "Ethiopia Yirgacheffe 250 g", "Coffee", 1190, 18, 30],
  ["EO-COL-250", "Colombia Huila 250 g", "Coffee", 1090, 52, 30],
  ["EO-BRA-1K", "Brazil Cerrado 1 kg", "Coffee", 2490, 9, 15],
  ["EO-DEC-250", "Swiss Water Decaf 250 g", "Coffee", 1150, 27, 20],
  ["EO-CB-1L", "Cold Brew Concentrate 1 l", "Coffee", 1490, 6, 12],
  ["EO-CHAI-200", "Spiced Chai 200 g", "Tea", 990, 44, 15],
  ["EO-MAT-100", "Ceremonial Matcha 100 g", "Tea", 2290, 4, 10],
  ["EO-V60", "Pour-Over Dripper V60", "Equipment", 2490, 21, 8],
  ["EO-FP-1L", "French Press 1 l", "Equipment", 3490, 12, 6],
  ["EO-GRD-M", "Manual Burr Grinder", "Equipment", 5900, 3, 5],
  ["EO-MUG-OAK", "Stoneware Mug 'Oak'", "Merch", 1490, 75, 20],
  ["EO-TOTE", "Canvas Tote Bag", "Merch", 990, 33, 15],
  ["EO-GIFT-25", "Gift Card €25", "Gift", 2500, 999, 0],
  ["EO-SUB-M", "Monthly Coffee Subscription", "Subscription", 2190, 999, 0],
];

const day = (d: Date) => d.toISOString().slice(0, 10);

export function seedIfEmpty(db: DB, today = new Date()) {
  const n = db.prepare("SELECT COUNT(*) AS n FROM customers").get() as { n: number };
  if (n.n > 0) return false;
  const r = rng(20261001);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  db.exec("BEGIN");
  try {
    const insP = db.prepare("INSERT INTO products (sku,name,category,price_cents,stock,reorder_level) VALUES (?,?,?,?,?,?)");
    for (const p of PRODUCTS) insP.run(...p);

    const insC = db.prepare("INSERT INTO customers (name,email,city,company,created_at) VALUES (?,?,?,?,?)");
    const used = new Set<string>();
    for (let i = 0; i < 48; i++) {
      let f = pick(FIRST), l = pick(LAST);
      while (used.has(f + l)) { f = pick(FIRST); l = pick(LAST); }
      used.add(f + l);
      const company = r() < 0.18 ? pick(COMPANIES) : null;
      const joined = new Date(today.getTime() - (200 + Math.floor(r() * 500)) * 864e5);
      insC.run(`${f} ${l}`, `${f}.${l}`.toLowerCase() + "@example.com", pick(CITIES), company, day(joined));
    }

    const insO = db.prepare("INSERT INTO orders (customer_id,status,created_at,total_cents) VALUES (?,?,?,?)");
    const insI = db.prepare("INSERT INTO order_items (order_id,product_id,qty,price_cents) VALUES (?,?,?,?)");
    const insInv = db.prepare("INSERT INTO invoices (order_id,number,amount_cents,status,due_date) VALUES (?,?,?,?,?)");
    const nProducts = PRODUCTS.length;
    for (let k = 0; k < 320; k++) {
      const ago = Math.floor(Math.pow(r(), 1.4) * 180);
      const created = new Date(today.getTime() - ago * 864e5 - Math.floor(r() * 10) * 36e5);
      const customer = 1 + Math.floor(Math.pow(r(), 1.7) * 48);
      let status: string;
      if (ago <= 1) status = r() < 0.6 ? "pending" : "paid";
      else if (ago <= 4) status = pick(["paid", "shipped", "shipped", "pending"]);
      else status = r() < 0.06 ? "cancelled" : r() < 0.05 ? "returned" : "delivered";
      const lines = 1 + Math.floor(r() * 3);
      let total = 0;
      const items: [number, number, number][] = [];
      for (let j = 0; j < lines; j++) {
        const pid = 1 + Math.floor(Math.pow(r(), 1.3) * nProducts);
        const qty = PRODUCTS[pid - 1][2] === "Coffee" ? 1 + Math.floor(r() * 3) : 1;
        const price = PRODUCTS[pid - 1][3];
        items.push([pid, qty, price]);
        total += qty * price;
      }
      const { lastInsertRowid } = insO.run(customer, status, created.toISOString(), total);
      const oid = Number(lastInsertRowid);
      for (const [pid, qty, price] of items) insI.run(oid, pid, qty, price);
      if (status !== "cancelled") {
        const due = new Date(created.getTime() + 14 * 864e5);
        const paid = status === "delivered" ? r() < 0.93 : status === "returned" ? true : status !== "pending" && r() < 0.5;
        insInv.run(oid, `EO-${created.getFullYear()}-${String(oid).padStart(5, "0")}`, total, status === "returned" ? "void" : paid ? "paid" : "open", day(due));
      }
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return true;
}
