#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { openDb, euros, type DB } from "./db.js";
import { seedIfEmpty } from "./seed.js";

const DB_PATH = process.env.DB_PATH ?? new URL("../data/shop.db", import.meta.url).pathname;
const READ_ONLY = process.env.READ_ONLY === "1";
const MAX_ROWS = 50;

const db: DB = openDb(DB_PATH);
seedIfEmpty(db);

const server = new McpServer({ name: "ember-oak-shop", version: "1.0.0" });

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const fail = (message: string) => ({ isError: true, content: [{ type: "text" as const, text: message }] });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const all = (sql: string, ...p: (string | number | null)[]) => db.prepare(sql).all(...p) as Record<string, any>[];
const one = (sql: string, ...p: (string | number | null)[]) => db.prepare(sql).get(...p) as Record<string, any> | undefined;
const audit = (tool: string, summary: string) =>
  db.prepare("INSERT INTO audit_log (at,tool,summary) VALUES (?,?,?)").run(new Date().toISOString(), tool, summary);

// ---------- read-only tools ----------

server.registerTool("search_customers", {
  title: "Search customers",
  description: "Find customers by name, email, city or company. Returns lifetime order count and revenue.",
  inputSchema: { query: z.string().min(1).describe("Part of a name, email, city or company"), limit: z.number().int().min(1).max(MAX_ROWS).default(10) },
  annotations: { readOnlyHint: true },
}, async ({ query, limit }) => {
  const q = `%${query}%`;
  const rows = all(`
    SELECT c.id, c.name, c.email, c.city, c.company,
           COUNT(o.id) AS orders, COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled','returned') THEN o.total_cents END),0) AS revenue_cents
    FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
    WHERE c.name LIKE ? OR c.email LIKE ? OR c.city LIKE ? OR COALESCE(c.company,'') LIKE ?
    GROUP BY c.id ORDER BY revenue_cents DESC LIMIT ?`, q, q, q, q, limit);
  return json(rows.map(({ revenue_cents, ...r }) => ({ ...r, revenue_eur: euros(revenue_cents) })));
});

server.registerTool("get_customer", {
  title: "Customer details",
  description: "Full profile of one customer: contact data, totals, open invoices and the latest orders.",
  inputSchema: { customer_id: z.number().int().positive() },
  annotations: { readOnlyHint: true },
}, async ({ customer_id }) => {
  const c = one("SELECT * FROM customers WHERE id = ?", customer_id);
  if (!c) return fail(`No customer with id ${customer_id}.`);
  const orders = all("SELECT id, status, substr(created_at,1,10) AS date, total_cents FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10", customer_id);
  const open = all(`SELECT i.number, i.amount_cents, i.due_date FROM invoices i JOIN orders o ON o.id = i.order_id
                    WHERE o.customer_id = ? AND i.status = 'open' ORDER BY i.due_date`, customer_id);
  return json({
    ...c,
    latest_orders: orders.map(({ total_cents, ...o }) => ({ ...o, total_eur: euros(total_cents) })),
    open_invoices: open.map(({ amount_cents, ...i }) => ({ ...i, amount_eur: euros(amount_cents) })),
  });
});

server.registerTool("list_orders", {
  title: "List orders",
  description: "List orders filtered by status, date range and/or customer. Dates are YYYY-MM-DD (inclusive).",
  inputSchema: {
    status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled", "returned"]).optional(),
    from: isoDate.optional(), to: isoDate.optional(),
    customer_id: z.number().int().positive().optional(),
    older_than_days: z.number().int().min(0).optional().describe("Only orders created more than N days ago"),
    limit: z.number().int().min(1).max(MAX_ROWS).default(20),
  },
  annotations: { readOnlyHint: true },
}, async ({ status, from, to, customer_id, older_than_days, limit }) => {
  const where: string[] = [], p: (string | number)[] = [];
  if (status) { where.push("o.status = ?"); p.push(status); }
  if (from) { where.push("substr(o.created_at,1,10) >= ?"); p.push(from); }
  if (to) { where.push("substr(o.created_at,1,10) <= ?"); p.push(to); }
  if (customer_id) { where.push("o.customer_id = ?"); p.push(customer_id); }
  if (older_than_days != null) { where.push("julianday('now') - julianday(o.created_at) > ?"); p.push(older_than_days); }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = one(`SELECT COUNT(*) AS n FROM orders o ${w}`, ...p)!.n;
  const rows = all(`
    SELECT o.id, substr(o.created_at,1,10) AS date, o.status, c.name AS customer, o.total_cents,
           CAST(julianday('now') - julianday(o.created_at) AS INTEGER) AS age_days
    FROM orders o JOIN customers c ON c.id = o.customer_id ${w}
    ORDER BY o.created_at DESC LIMIT ?`, ...p, limit);
  return json({ total_matching: total, shown: rows.length, orders: rows.map(({ total_cents, ...o }) => ({ ...o, total_eur: euros(total_cents) })) });
});

server.registerTool("low_stock", {
  title: "Low stock",
  description: "Products at or below their reorder level, with average weekly sales over the last 8 weeks and estimated weeks of stock left.",
  inputSchema: {},
  annotations: { readOnlyHint: true },
}, async () => {
  const rows = all(`
    SELECT p.sku, p.name, p.stock, p.reorder_level,
           ROUND(COALESCE(SUM(CASE WHEN o.created_at >= datetime('now','-56 days') AND o.status NOT IN ('cancelled','returned') THEN i.qty END),0) / 8.0, 1) AS avg_weekly_sales
    FROM products p LEFT JOIN order_items i ON i.product_id = p.id LEFT JOIN orders o ON o.id = i.order_id
    WHERE p.stock <= p.reorder_level
    GROUP BY p.id ORDER BY (p.stock * 1.0 / MAX(p.reorder_level,1)) ASC`);
  const withRunway = rows.map(r => ({ ...r, weeks_left: r.avg_weekly_sales > 0 ? Math.round((r.stock / r.avg_weekly_sales) * 10) / 10 : null }));
  return json(withRunway.sort((a, b) => (a.weeks_left ?? Infinity) - (b.weeks_left ?? Infinity)));
});

server.registerTool("sales_report", {
  title: "Sales report",
  description: "Revenue and order count for a date range, grouped by day, week, month, product, category or customer. Cancelled and returned orders are excluded.",
  inputSchema: { from: isoDate, to: isoDate, group_by: z.enum(["day", "week", "month", "product", "category", "customer"]).default("month"), limit: z.number().int().min(1).max(MAX_ROWS).default(12) },
  annotations: { readOnlyHint: true },
}, async ({ from, to, group_by, limit }) => {
  if (from > to) return fail("`from` must be on or before `to`.");
  const base = "o.status NOT IN ('cancelled','returned') AND substr(o.created_at,1,10) BETWEEN ? AND ?";
  const totals = one(`SELECT COUNT(*) AS orders, COALESCE(SUM(total_cents),0) AS revenue_cents FROM orders o WHERE ${base}`, from, to)!;
  let rows: Record<string, any>[];
  if (["day", "week", "month"].includes(group_by)) {
    const key = { day: "substr(o.created_at,1,10)", week: "strftime('%Y-W%W', o.created_at)", month: "substr(o.created_at,1,7)" }[group_by as "day" | "week" | "month"];
    rows = all(`SELECT ${key} AS period, COUNT(*) AS orders, SUM(o.total_cents) AS revenue_cents FROM orders o WHERE ${base} GROUP BY period ORDER BY period LIMIT ?`, from, to, limit);
  } else if (group_by === "customer") {
    rows = all(`SELECT c.name AS customer, COUNT(*) AS orders, SUM(o.total_cents) AS revenue_cents FROM orders o JOIN customers c ON c.id=o.customer_id WHERE ${base} GROUP BY c.id ORDER BY revenue_cents DESC LIMIT ?`, from, to, limit);
  } else {
    const col = group_by === "product" ? "p.name" : "p.category";
    rows = all(`SELECT ${col} AS ${group_by}, SUM(i.qty) AS units, SUM(i.qty*i.price_cents) AS revenue_cents
                FROM order_items i JOIN orders o ON o.id=i.order_id JOIN products p ON p.id=i.product_id
                WHERE ${base} GROUP BY ${col} ORDER BY revenue_cents DESC LIMIT ?`, from, to, limit);
  }
  return json({
    from, to, group_by,
    total_orders: totals.orders, total_revenue_eur: euros(totals.revenue_cents),
    rows: rows.map(({ revenue_cents, ...r }) => ({ ...r, revenue_eur: euros(revenue_cents) })),
  });
});

server.registerTool("unpaid_invoices", {
  title: "Unpaid invoices",
  description: "Open invoices, optionally only overdue ones, with the customer and days overdue.",
  inputSchema: { overdue_only: z.boolean().default(true), limit: z.number().int().min(1).max(MAX_ROWS).default(20) },
  annotations: { readOnlyHint: true },
}, async ({ overdue_only, limit }) => {
  const rows = all(`
    SELECT i.number, c.name AS customer, c.email, i.amount_cents, i.due_date,
           CAST(julianday('now') - julianday(i.due_date) AS INTEGER) AS days_overdue
    FROM invoices i JOIN orders o ON o.id=i.order_id JOIN customers c ON c.id=o.customer_id
    WHERE i.status='open' ${overdue_only ? "AND i.due_date < date('now')" : ""}
    ORDER BY i.due_date LIMIT ?`, limit);
  const sum = rows.reduce((s, r) => s + r.amount_cents, 0);
  return json({ count: rows.length, total_eur: euros(sum), invoices: rows.map(({ amount_cents, ...r }) => ({ ...r, amount_eur: euros(amount_cents), days_overdue: Math.max(0, r.days_overdue) })) });
});

server.registerTool("recent_changes", {
  title: "Recent changes",
  description: "Audit log of every change made through this server (who changed what, when).",
  inputSchema: { limit: z.number().int().min(1).max(MAX_ROWS).default(20) },
  annotations: { readOnlyHint: true },
}, async ({ limit }) => json(all("SELECT at, tool, summary FROM audit_log ORDER BY id DESC LIMIT ?", limit)));

// ---------- write tools (two-step: preview first, then confirm) ----------

if (!READ_ONLY) {
  const NEXT: Record<string, string[]> = {
    pending: ["paid", "cancelled"], paid: ["shipped", "cancelled"], shipped: ["delivered", "returned"],
    delivered: ["returned"], cancelled: [], returned: [],
  };

  server.registerTool("update_order_status", {
    title: "Update order status",
    description: "Move an order to its next status (pending → paid → shipped → delivered; cancel or return where allowed). Call once without confirm to get a preview; repeat with confirm=true only after the user explicitly agrees.",
    inputSchema: { order_id: z.number().int().positive(), status: z.enum(["paid", "shipped", "delivered", "cancelled", "returned"]), confirm: z.boolean().default(false) },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  }, async ({ order_id, status, confirm }) => {
    const o = one("SELECT o.id, o.status, c.name AS customer, o.total_cents FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.id = ?", order_id);
    if (!o) return fail(`No order with id ${order_id}.`);
    if (o.status === status) return json({ unchanged: true, order_id, status });
    if (!NEXT[o.status].includes(status)) return fail(`Order ${order_id} is '${o.status}'. Allowed next: ${NEXT[o.status].join(", ") || "none (final state)"}.`);
    const change = { order_id, customer: o.customer, total_eur: euros(o.total_cents), from: o.status, to: status };
    if (!confirm) return json({ preview: change, note: "Nothing changed yet. Ask the user to confirm, then call again with confirm=true." });
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, order_id);
    if (status === "cancelled" || status === "returned") db.prepare("UPDATE invoices SET status='void' WHERE order_id = ?").run(order_id);
    audit("update_order_status", `Order #${order_id} (${o.customer}): ${o.status} → ${status}`);
    return json({ done: true, ...change });
  });

  server.registerTool("adjust_stock", {
    title: "Adjust stock",
    description: "Add or remove stock for a product (e.g. a delivery arrived, or a stock count correction). Preview first; repeat with confirm=true after the user agrees.",
    inputSchema: { sku: z.string(), delta: z.number().int().refine(n => n !== 0, "delta must not be 0"), reason: z.string().min(3), confirm: z.boolean().default(false) },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  }, async ({ sku, delta, reason, confirm }) => {
    const p = one("SELECT sku, name, stock FROM products WHERE sku = ?", sku);
    if (!p) return fail(`Unknown SKU '${sku}'.`);
    if (p.stock + delta < 0) return fail(`Stock would go negative (${p.stock} + ${delta}).`);
    const change = { sku, product: p.name, stock_before: p.stock, stock_after: p.stock + delta, reason };
    if (!confirm) return json({ preview: change, note: "Nothing changed yet. Ask the user to confirm, then call again with confirm=true." });
    db.prepare("UPDATE products SET stock = stock + ? WHERE sku = ?").run(delta, sku);
    audit("adjust_stock", `${p.name}: ${p.stock} → ${p.stock + delta} (${reason})`);
    return json({ done: true, ...change });
  });
}

// ---------- resource + prompt ----------

server.registerResource("schema", "shop://schema", {
  title: "Data model", description: "What data this server exposes", mimeType: "text/markdown",
}, async uri => ({
  contents: [{ uri: uri.href, mimeType: "text/markdown", text: [
    "# Ember & Oak shop data",
    "- **customers** – name, email, city, company",
    "- **products** – sku, name, category, price, stock, reorder level",
    "- **orders** – status pending → paid → shipped → delivered (or cancelled / returned)",
    "- **invoices** – one per order, open / paid / void, 14-day terms",
    "- **audit_log** – every change made through this server",
    "", "Money is in EUR. Write tools always preview first and need confirm=true.",
  ].join("\n") }],
}));

server.registerPrompt("weekly_report", {
  title: "Weekly business report",
  description: "Summarise last week: revenue vs. the week before, top products, stuck orders, overdue invoices and low stock.",
}, () => ({
  messages: [{ role: "user", content: { type: "text", text:
    "Write a short weekly report for the owner of Ember & Oak. Use the tools to get: revenue and orders for the last 7 days and the 7 days before (sales_report), the top 5 products last week, orders still 'paid' or 'pending' after 3 days, overdue invoices, and low stock. Keep it under 200 words with clear next actions." } }],
}));

await server.connect(new StdioServerTransport());
console.error(`ember-oak-shop MCP server ready (db: ${DB_PATH}${READ_ONLY ? ", read-only" : ""})`);
