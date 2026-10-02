# MCP Business Server — talk to your shop data in plain language

An [MCP](https://modelcontextprotocol.io) server that connects **Claude** (Desktop, Code, claude.ai) or any other MCP-capable assistant to a business database. Instead of clicking through five admin screens or exporting to Excel, the owner just asks:

> *“Which paid orders have been waiting more than 2 days to ship?”*
> *“What were our best sellers in the last 30 days?”*
> *“What do we need to reorder?”* · *“Who still owes us money?”*

The demo data belongs to **Ember & Oak**, a fictional coffee roastery with a web shop (48 customers, 16 products, ~320 orders, invoices). Swap `src/db.ts` for your own CRM, shop, ERP or REST API and the rest stays the same.

## Tools

| Tool | What it answers | Writes? |
|---|---|---|
| `search_customers` | Find customers by name, email, city or company — with lifetime revenue | – |
| `get_customer` | One customer: contact data, latest orders, open invoices | – |
| `list_orders` | Orders by status, date range, customer, or “older than N days” | – |
| `sales_report` | Revenue by day / week / month / product / category / customer | – |
| `low_stock` | Products below reorder level, avg. weekly sales, weeks of stock left | – |
| `unpaid_invoices` | Open / overdue invoices with days overdue | – |
| `recent_changes` | Audit log of everything changed through the server | – |
| `update_order_status` | Move an order through pending → paid → shipped → delivered | ✔ preview + confirm |
| `adjust_stock` | Book in a delivery or correct a stock count | ✔ preview + confirm |

Plus a `shop://schema` resource and a `weekly_report` prompt.

## Built to be safe with real business data

- **Read-only mode** — `READ_ONLY=1` removes every write tool. Start here.
- **Two-step writes** — a write tool first returns a *preview* and changes nothing; it only acts when called again with `confirm=true` after the user agrees.
- **Business rules in code, not in the prompt** — an order can only move to an allowed next status; stock can't go negative.
- **Audit log** — every change is recorded with time, tool and a human-readable summary.
- **Validated inputs** — every argument is checked with Zod; bad dates or ids return a clear error the assistant can fix.
- **Bounded results** — lists are capped (max 50 rows) so the assistant never pulls the whole database into the chat.
- **Parameterised SQL only** — no string-built queries from model input.

## Run it

Requires Node.js 22.13+ (uses the built-in `node:sqlite`, no native dependencies).

```bash
npm install
npm run build
npm run demo      # starts the server over stdio and runs real tool calls
```

The database is created and filled with demo data on first start (`data/shop.db`, or set `DB_PATH`).

### Claude Desktop

`Settings → Developer → Edit Config` (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ember-oak-shop": {
      "command": "node",
      "args": ["--no-warnings", "/absolute/path/to/mcp-business-server/dist/server.js"],
      "env": { "READ_ONLY": "1" }
    }
  }
}
```

### Claude Code

```bash
claude mcp add ember-oak-shop -e READ_ONLY=1 -- node --no-warnings /absolute/path/to/dist/server.js
```

### MCP Inspector

```bash
npm run inspect
```

## Adapting it to your business

`src/db.ts` + `src/seed.ts` are the only places that know about the demo data. For a real client the tools stay small and purpose-built, but the data layer becomes their system: PostgreSQL / MySQL, a Shopify or WooCommerce store, an ERP or CRM API (Xentral, lexoffice, HubSpot, …). For remote use the same server can run over Streamable HTTP with OAuth instead of stdio.

---

Built by **Aurum Forge by Zolotuhin**. Ember & Oak and all customer data are fictional.
