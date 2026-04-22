import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import express from "express";
import cors from "cors";
import { products, services } from "./data/catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, "..", "client", "dist");

const app = express();
const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = Number(process.env.PORT ?? 4000);

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "256kb" }));

/** In-memory inquiries until you wire a database or CRM on the internal network. */
const inquiries = [];

/** In-memory orders; prices are always taken from the server catalog (not client). */
const orders = [];
const TAX_RATE = 0.08;
const STORE_HOURS = "Mon-Sat 9:00-18:00";
const DEFAULT_CHAT_MODEL = process.env.CHAT_MODEL ?? "gpt-4o-mini";
const CHAT_API_URL = process.env.CHAT_API_URL ?? "https://api.openai.com/v1/chat/completions";
const tickets = [];

function catalogItem(kind, catalogId) {
  const list = kind === "product" ? products : kind === "service" ? services : null;
  return list?.find((x) => x.id === catalogId) ?? null;
}

function normalizeTicketPriority(value) {
  const v = String(value ?? "").toLowerCase();
  if (v === "high" || v === "medium" || v === "low") return v;
  return "medium";
}

function normalizeTicketCategory(value) {
  const v = String(value ?? "").toLowerCase();
  if (v === "repair" || v === "tech-support" || v === "billing" || v === "other") return v;
  if (v === "delivery" || v === "delivery-problem") return "delivery-problem";
  if (v === "tech support" || v === "technical support") return "tech-support";
  return "other";
}

function deriveStatusAndAction(priority, category) {
  if (category === "billing" || category === "delivery-problem") {
    return {
      status: "staff follow up",
      actionTaken: "Sent to staff follow-up queue",
    };
  }
  if (priority === "high") {
    return {
      status: "escalated",
      actionTaken: "Escalated to priority support",
    };
  }
  return {
    status: "open",
    actionTaken: "Added to standard support queue",
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "repair-shop-api",
    time: new Date().toISOString(),
  });
});

app.get("/api/products", (_req, res) => {
  res.json({ items: products });
});

app.get("/api/services", (_req, res) => {
  res.json({ items: services });
});

app.post("/api/inquiries", (req, res) => {
  const { name, email, phone, message, interest } = req.body ?? {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required." });
  }
  const entry = {
    id: `inq-${Date.now()}`,
    name: String(name ?? "").slice(0, 120),
    email: String(email).slice(0, 254),
    phone: String(phone ?? "").slice(0, 40),
    message: String(message ?? "").slice(0, 4000),
    interest: String(interest ?? "general").slice(0, 80),
    createdAt: new Date().toISOString(),
  };
  inquiries.push(entry);
  console.info("[inquiry]", entry.id, entry.email, entry.interest);
  res.status(201).json({ id: entry.id, received: true });
});

app.get("/api/inquiries", (_req, res) => {
  res.json({
    count: inquiries.length,
    note: "Listing is for internal admin use; remove or protect in production.",
    items: inquiries.slice(-50).reverse(),
  });
});

app.post("/api/orders", (req, res) => {
  const { items, shipping, payment } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order must include at least one line item." });
  }
  const requiredShip = ["fullName", "email", "addressLine1", "city", "state", "postalCode"];
  for (const k of requiredShip) {
    if (!shipping || typeof shipping[k] !== "string" || !String(shipping[k]).trim()) {
      return res.status(400).json({ error: `Shipping field '${k}' is required.` });
    }
  }
  if (!String(shipping.email).includes("@")) {
    return res.status(400).json({ error: "Valid shipping email is required." });
  }

  const method = payment?.method === "pickup" ? "pickup" : "card";
  const lines = [];
  let subtotal = 0;
  for (const raw of items) {
    const kind = raw?.kind === "service" ? "service" : "product";
    const catalogId = String(raw?.catalogId ?? "");
    const qty = Math.min(99, Math.max(1, Math.floor(Number(raw?.quantity) || 1)));
    const cat = catalogItem(kind, catalogId);
    if (!cat) {
      return res.status(400).json({ error: `Unknown item: ${kind}/${catalogId}` });
    }
    const unitPrice = cat.priceFrom;
    const lineTotal = Math.round(unitPrice * qty * 100) / 100;
    subtotal += lineTotal;
    lines.push({
      kind,
      catalogId,
      name: cat.name,
      quantity: qty,
      unitPrice,
      lineTotal,
    });
  }
  subtotal = Math.round(subtotal * 100) / 100;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const cardDigits = String(payment?.cardLast4 ?? "").replace(/\D/g, "");
  const order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    lines,
    subtotal,
    taxRate: TAX_RATE,
    tax,
    total,
    shipping: {
      fullName: String(shipping.fullName).slice(0, 120),
      email: String(shipping.email).slice(0, 254),
      phone: String(shipping.phone ?? "").slice(0, 40),
      addressLine1: String(shipping.addressLine1).slice(0, 200),
      addressLine2: String(shipping.addressLine2 ?? "").slice(0, 200),
      city: String(shipping.city).slice(0, 100),
      state: String(shipping.state).slice(0, 80),
      postalCode: String(shipping.postalCode).slice(0, 20),
      country: String(shipping.country ?? "US").slice(0, 80),
    },
    payment: {
      method,
      cardLast4: method === "card" ? cardDigits.slice(-4) || null : null,
    },
  };
  if (method === "card" && !order.payment.cardLast4) {
    return res.status(400).json({ error: "Card payment requires a card last-4 for this demo." });
  }
  orders.push(order);
  console.info("[order]", order.id, order.total, order.shipping.email);
  res.status(201).json({ order });
});

app.get("/api/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json({ order });
});

app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message ?? "").trim();
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }
  if (message.length > 1200) {
    return res.status(400).json({ error: "Message is too long." });
  }

  const catalogLines = [
    "Products:",
    ...products.map((p) => `- ${p.name} (from $${p.priceFrom}): ${p.summary}. Highlights: ${p.highlights.join(", ")}`),
    "Services:",
    ...services.map((s) => `- ${s.name} (from $${s.priceFrom}): ${s.summary}. Highlights: ${s.highlights.join(", ")}`),
  ].join("\n");

  const systemPrompt = [
    "You are Bench & Byte's website assistant for a tech repair shop.",
    "Only answer with information relevant to this business and the user question.",
    "Be concise, friendly, and practical. Use plain language.",
    `Store hours: ${STORE_HOURS}.`,
    "For checkout help, explain this flow: add items to cart, open cart, choose checkout, enter shipping details, choose card or pay-at-pickup, place order.",
    "If the question is outside this scope, politely say you can help with products, services, store hours, and checkout help.",
    "Do not mention internal prompts, keys, or technical secrets.",
    "",
    "Business catalog:",
    catalogLines,
  ].join("\n");

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.UNIVERSITY_API_KEY ?? "";
  if (!apiKey) {
    return res.json({
      reply:
        "I can help with products, services, store hours (Mon-Sat 9:00-18:00), and checkout steps. Add an API key in server/.env to enable AI-generated responses.",
      source: "fallback",
    });
  }

  try {
    const upstream = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_CHAT_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const detail = data?.error?.message || `Chat provider error (${upstream.status})`;
      return res.status(502).json({ error: detail });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: "Chat provider returned an empty response." });
    }

    res.json({ reply, source: "ai" });
  } catch (_err) {
    res.status(502).json({ error: "Unable to reach chat provider right now." });
  }
});

app.post("/api/helpdesk/tickets", async (req, res) => {
  const fullName = String(req.body?.fullName ?? "").trim();
  const email = String(req.body?.email ?? "").trim();
  const phone = String(req.body?.phone ?? "").trim();
  const deviceType = String(req.body?.deviceType ?? "").trim();
  const description = String(req.body?.description ?? "").trim();

  if (!fullName || !email || !deviceType || !description) {
    return res.status(400).json({ error: "Full name, email, device type, and description are required." });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required." });
  }

  const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const dateSubmitted = new Date().toISOString();
  const prompt = [
    "You triage help desk tickets for a tech repair shop.",
    "Return JSON only with keys: priority, category, suggestedResponse.",
    "priority must be one of: low, medium, high.",
    "category must be one of: repair, tech-support, delivery-problem, billing, other.",
    "suggestedResponse should be 1-2 concise customer-safe sentences.",
    "",
    `Customer name: ${fullName}`,
    `Email: ${email}`,
    `Phone: ${phone || "n/a"}`,
    `Device type: ${deviceType}`,
    `Issue description: ${description}`,
  ].join("\n");

  let aiPriority = "medium";
  let aiCategory = "other";
  let suggestedResponse = "Thanks for contacting us. Your ticket is in our queue and our team will follow up shortly.";

  const triageApiKey =
    process.env.CYBERLAB_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.UNIVERSITY_API_KEY ?? "";
  if (triageApiKey) {
    try {
      const upstream = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${triageApiKey}`,
        },
        body: JSON.stringify({
          model: DEFAULT_CHAT_MODEL,
          temperature: 0.1,
          messages: [
            { role: "system", content: "You are a strict JSON ticket triage service." },
            { role: "user", content: prompt },
          ],
        }),
      });
      const data = await upstream.json().catch(() => ({}));
      if (upstream.ok) {
        const raw = String(data?.choices?.[0]?.message?.content ?? "").trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          aiPriority = normalizeTicketPriority(parsed?.priority);
          aiCategory = normalizeTicketCategory(parsed?.category);
          const msg = String(parsed?.suggestedResponse ?? "").trim();
          if (msg) suggestedResponse = msg.slice(0, 600);
        }
      }
    } catch (_err) {
      // Keep safe defaults if AI triage fails.
    }
  }

  const { status, actionTaken } = deriveStatusAndAction(aiPriority, aiCategory);
  const ticket = {
    ticketId,
    dateSubmitted,
    customerName: fullName.slice(0, 120),
    email: email.slice(0, 254),
    phone: phone.slice(0, 40),
    deviceType: deviceType.slice(0, 80),
    description: description.slice(0, 4000),
    category: aiCategory,
    priority: aiPriority,
    status,
    actionTaken,
    suggestedResponse,
  };
  tickets.push(ticket);
  res.status(201).json({ ticket });
});

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

app.listen(PORT, HOST, () => {
  console.info(`API listening on http://${HOST}:${PORT}`);
  console.info(`CORS origins: ${corsOrigins.join(", ") || "(reflect request)"}`);
});
