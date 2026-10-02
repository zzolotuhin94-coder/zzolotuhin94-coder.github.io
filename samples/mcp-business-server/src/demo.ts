// End-to-end demo: starts the server over stdio exactly like Claude Desktop / Claude Code would,
// then calls the tools an assistant would call for a few everyday questions.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dbPath = join(mkdtempSync(join(tmpdir(), "ember-oak-")), "shop.db");
const serverPath = fileURLToPath(new URL("./server.js", import.meta.url));
const transport = new StdioClientTransport({ command: process.execPath, args: ["--no-warnings", serverPath], env: { ...process.env, DB_PATH: dbPath } as Record<string, string> });
const client = new Client({ name: "demo-client", version: "1.0.0" });
await client.connect(transport);

const today = new Date();
const d = (daysAgo: number) => new Date(today.getTime() - daysAgo * 864e5).toISOString().slice(0, 10);
const log: { question: string; tool: string; args: unknown; result: unknown; isError?: boolean }[] = [];

async function ask(question: string, tool: string, args: Record<string, unknown>) {
  const res = (await client.callTool({ name: tool, arguments: args })) as { content: { type: string; text: string }[]; isError?: boolean };
  const text = res.content.map(c => c.text).join("\n");
  let result: unknown = text;
  try { result = JSON.parse(text); } catch {}
  log.push({ question, tool, args, result, isError: res.isError });
  console.log(`\n\x1b[1m? ${question}\x1b[0m\n\x1b[2m→ ${tool}(${JSON.stringify(args)})\x1b[0m`);
  console.log(text.length > 1400 ? text.slice(0, 1400) + "\n…" : text);
  return result as any;
}

const { tools } = await client.listTools();
console.log(`Connected. ${tools.length} tools: ${tools.map(t => t.name).join(", ")}`);

await ask("Which paid orders have been waiting more than 2 days to ship?", "list_orders", { status: "paid", older_than_days: 2, limit: 5 });
await ask("What were our best sellers in the last 30 days?", "sales_report", { from: d(30), to: d(0), group_by: "product", limit: 5 });
await ask("How did revenue develop month by month?", "sales_report", { from: d(150), to: d(0), group_by: "month" });
await ask("What do we need to reorder?", "low_stock", {});
await ask("Who still owes us money?", "unpaid_invoices", { overdue_only: true, limit: 5 });
await ask("Show me our hotel customers.", "search_customers", { query: "Hotel" });

const stuck = log[0].result as { orders: { id: number }[] };
const id = stuck.orders[0]?.id ?? 1;
await ask(`Mark order #${id} as shipped.`, "update_order_status", { order_id: id, status: "shipped" });
await ask("Yes, confirm.", "update_order_status", { order_id: id, status: "shipped", confirm: true });
await ask(`Mark order #${id} as paid again.`, "update_order_status", { order_id: id, status: "paid" });
await ask("What has changed today?", "recent_changes", { limit: 5 });

writeFileSync(new URL("../demo-output.json", import.meta.url), JSON.stringify({ date: d(0), tools: tools.map(t => ({ name: t.name, title: t.title, readOnly: t.annotations?.readOnlyHint })), log }, null, 2));
await client.close();
