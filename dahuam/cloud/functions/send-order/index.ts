// DAHUAM.202 Küche · Server-Funktion "send-order" (Supabase Edge Function, Deno)
// Sendet eine Bestellung per E-Mail an den Lieferanten. Der Schlüssel des
// Mail-Dienstes liegt nur hier auf dem Server (Supabase Secrets), nie in der App.
//
// Benötigte Secrets (Supabase → Edge Functions → Secrets):
//   ORDER_FROM_EMAIL   Absender, z. B. bestellung@dahuam202.at (Domain beim Mail-Dienst bestätigt)
//   ALLOWED_ORIGIN     z. B. https://zzolotuhin94-coder.github.io
//   und genau EINEN Mail-Dienst:
//   BREVO_API_KEY      (Brevo, EU)  oder  RESEND_API_KEY (Resend)
// SUPABASE_URL, SUPABASE_ANON_KEY und SUPABASE_SERVICE_ROLE_KEY stellt Supabase automatisch bereit.

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cors(origin: string | null) {
  const allowed = Deno.env.get("ALLOWED_ORIGIN") ?? "";
  const ok = origin && allowed.split(",").map((s) => s.trim()).includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin! : allowed.split(",")[0] ?? "",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

async function rest(path: string, key: string, auth: string, init: RequestInit = {}) {
  const url = Deno.env.get("SUPABASE_URL")!.replace(/\/+$/, "") + path;
  const r = await fetch(url, { ...init, headers: { apikey: key, Authorization: auth, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

async function sendMail(p: { fromName: string; from: string; to: string; replyTo?: string; subject: string; text: string }) {
  const brevo = Deno.env.get("BREVO_API_KEY"), resend = Deno.env.get("RESEND_API_KEY");
  if (brevo) {
    const r = await fetch(Deno.env.get("BREVO_URL") ?? "https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevo, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: p.fromName, email: p.from }, to: [{ email: p.to }], ...(p.replyTo ? { replyTo: { email: p.replyTo } } : {}), subject: p.subject, textContent: p.text }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Brevo ${r.status}: ${j.message ?? ""}`);
    return { provider: "brevo", id: String(j.messageId ?? "") };
  }
  if (resend) {
    const r = await fetch(Deno.env.get("RESEND_URL") ?? "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `${p.fromName} <${p.from}>`, to: [p.to], ...(p.replyTo ? { reply_to: p.replyTo } : {}), subject: p.subject, text: p.text }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Resend ${r.status}: ${j.message ?? ""}`);
    return { provider: "resend", id: String(j.id ?? "") };
  }
  throw new Error("Kein Mail-Dienst eingerichtet (BREVO_API_KEY oder RESEND_API_KEY fehlt)");
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return json({ message: "Nur POST" }, 405, h);

  const auth = req.headers.get("Authorization") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!auth.startsWith("Bearer ")) return json({ message: "Nicht angemeldet" }, 401, h);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ message: "Ungültige Anfrage" }, 400, h); }
  const rid = String(body.rid ?? ""), to = String(body.to ?? "").trim(), orderNo = String(body.orderNo ?? "").slice(0, 40);
  const subject = String(body.subject ?? "").slice(0, 200), text = String(body.text ?? ""), replyTo = String(body.replyTo ?? "").trim();
  if (!UUID_RE.test(rid) || !EMAIL_RE.test(to) || !orderNo || !subject || !text || text.length > 20000 || (replyTo && !EMAIL_RE.test(replyTo)))
    return json({ message: "Angaben unvollständig oder ungültig" }, 400, h);

  // Wer ruft auf? Token prüfen und Mitgliedschaft samt Rolle laden.
  let user: { id: string };
  try { user = await rest("/auth/v1/user", anon, auth); } catch { return json({ message: "Sitzung ungültig" }, 401, h); }
  const svc = `Bearer ${service}`;
  const mem = await rest(`/rest/v1/members?select=role,name&restaurant_id=eq.${rid}&user_id=eq.${user.id}`, service, svc);
  if (!mem?.length) return json({ message: "Kein Zugriff auf diesen Betrieb" }, 403, h);
  if (mem[0].role === "staff") return json({ message: "Mitarbeiter dürfen keine Bestellungen senden" }, 403, h);
  const rest0 = await rest(`/rest/v1/restaurants?select=name&id=eq.${rid}`, service, svc);
  const fromName = rest0?.[0]?.name ?? "Bestellung";
  const from = Deno.env.get("ORDER_FROM_EMAIL");
  if (!from) return json({ message: "Absender fehlt (ORDER_FROM_EMAIL)" }, 500, h);

  const log = (row: Record<string, unknown>) => rest("/rest/v1/order_mail_log", service, svc, { method: "POST", body: JSON.stringify({ restaurant_id: rid, order_no: orderNo, to_email: to, sent_by: user.id, ...row }) }).catch(() => null);
  try {
    const r = await sendMail({ fromName, from, to, replyTo: replyTo || undefined, subject, text });
    await log({ provider: r.provider, provider_id: r.id, status: "sent" });
    return json({ id: r.id, provider: r.provider }, 200, h);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log({ provider: Deno.env.get("BREVO_API_KEY") ? "brevo" : "resend", status: "error", error: msg.slice(0, 500) });
    return json({ message: msg }, 502, h);
  }
});
