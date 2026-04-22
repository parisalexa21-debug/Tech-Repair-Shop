import { useEffect, useState } from "react";
import { useCart } from "./cart/CartContext.jsx";
import { CartDrawer } from "./components/CartDrawer.jsx";
import { ChatWidget } from "./components/ChatWidget.jsx";
import { CheckoutFlow } from "./components/CheckoutFlow.jsx";
import { HelpDesk } from "./components/HelpDesk.jsx";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function Header({ onOpenCart, cartCount }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#top" className="logo">
          <span className="logo-mark" aria-hidden="true" />
          <span className="logo-text">Bench &amp; Byte</span>
        </a>
        <nav className="nav" aria-label="Primary">
          <a href="#products">Products</a>
          <a href="#services">Services</a>
          <a href="#helpdesk">Help desk</a>
          <a href="#contact">Contact</a>
          <button type="button" className="nav-cart" onClick={onOpenCart} aria-label="Open shopping cart">
            Cart
            {cartCount > 0 ? <span className="nav-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span> : null}
          </button>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Local tech repair &amp; sales</p>
          <h1>Devices fixed fast. Gear you can trust.</h1>
          <p className="lede">
            We sell phones, laptops, and tablets, and we back every sale with repairs, tech support,
            and delivery options built for busy schedules.
          </p>
          <div className="hero-actions">
            <a href="#products" className="btn btn-primary">
              Browse inventory
            </a>
            <a href="#services" className="btn btn-ghost">
              Our services
            </a>
          </div>
          <ul className="trust-row" aria-label="Highlights">
            <li>In-shop diagnostics</li>
            <li>Transparent pricing</li>
            <li>Business &amp; personal</li>
          </ul>
        </div>
        <div className="hero-panel" aria-hidden="true">
          <div className="hero-card">
            <span className="mono-label">Today&apos;s bench</span>
            <ul className="bench-list">
              <li>
                <span className="bench-dot" /> Screen swap — queued
              </li>
              <li>
                <span className="bench-dot bench-dot--on" /> SSD upgrade — in progress
              </li>
              <li>
                <span className="bench-dot" /> New laptop prep — ready
              </li>
            </ul>
            <p className="bench-note">Your internal network will power live status here later.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CatalogSection({ id, title, subtitle, items, kind, catalogType }) {
  const { addToCart } = useCart();
  return (
    <section className="section" id={id}>
      <div className="container">
        <header className="section-head">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </header>
        <div className="card-grid">
          {items.map((item) => (
            <article key={item.id} className="catalog-card">
              <div className="catalog-card-top">
                <span className={`kind-badge kind-badge--${kind}`}>{kind}</span>
                <h3>{item.name}</h3>
                <p className="catalog-summary">{item.summary}</p>
              </div>
              <p className="price-from">
                From <strong>${item.priceFrom}</strong>
              </p>
              <ul className="highlights">
                {item.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-primary btn-add-cart"
                onClick={() => addToCart(catalogType, item)}
              >
                Add to cart
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [interest, setInterest] = useState("general");
  const [status, setStatus] = useState({ type: "idle", message: "" });

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      message: form.message.value,
      interest,
    };
    setStatus({ type: "sending", message: "Sending…" });
    try {
      const res = await fetch(`${API_BASE}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send");
      setStatus({ type: "ok", message: "Thanks — we received your message and will reply soon." });
      form.reset();
    } catch (err) {
      setStatus({
        type: "err",
        message: err.message || "Something went wrong. Is the API running?",
      });
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Name</span>
        <input name="name" type="text" autoComplete="name" placeholder="Alex Rivera" />
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
      </label>
      <label className="field">
        <span>Phone</span>
        <input name="phone" type="tel" autoComplete="tel" placeholder="Optional" />
      </label>
      <label className="field">
        <span>I&apos;m interested in</span>
        <select value={interest} onChange={(e) => setInterest(e.target.value)}>
          <option value="general">General question</option>
          <option value="product-phone">Buying a phone</option>
          <option value="product-laptop">Buying a laptop</option>
          <option value="product-tablet">Buying a tablet</option>
          <option value="service-repair">Repair</option>
          <option value="service-tech-support">Tech support</option>
          <option value="service-delivery">Delivery</option>
        </select>
      </label>
      <label className="field field--full">
        <span>Message</span>
        <textarea name="message" rows={4} placeholder="Device model, issue, or what you need…" />
      </label>
      <div className="form-footer">
        <button type="submit" className="btn btn-primary" disabled={status.type === "sending"}>
          {status.type === "sending" ? "Sending…" : "Send message"}
        </button>
        {status.message ? (
          <p className={`form-status form-status--${status.type}`} role="status">
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>
          <strong>Bench &amp; Byte</strong> — tech sales &amp; repair. API ready for your internal
          network when routing and DNS are configured.
        </p>
        <p className="footer-meta">© {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function App() {
  const { itemCount } = useCart();
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [p, s] = await Promise.all([fetchJson("/api/products"), fetchJson("/api/services")]);
        if (!cancelled) {
          setProducts(p.items ?? []);
          setServices(s.items ?? []);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function beginCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  return (
    <>
      <Header onOpenCart={() => setCartOpen(true)} cartCount={itemCount} />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={beginCheckout}
      />
      <CheckoutFlow open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      <main>
        <Hero />
        {loadError ? (
          <div className="banner container" role="alert">
            <p>
              <strong>Could not load catalog from the API.</strong> {loadError} Start the backend
              with <code>npm run dev</code> in <code>server/</code> (or use the Vite dev server
              proxy).
            </p>
          </div>
        ) : null}
        <CatalogSection
          id="products"
          title="Products"
          subtitle="Phones, laptops, and tablets — curated for reliability and everyday use."
          items={products}
          kind="sale"
          catalogType="product"
        />
        <CatalogSection
          id="services"
          title="Services"
          subtitle="Repairs, expert support, and delivery so you are never stuck without help."
          items={services}
          kind="service"
          catalogType="service"
        />
        <HelpDesk />
        <section className="section section--contact" id="contact">
          <div className="container contact-grid">
            <div>
              <header className="section-head section-head--left">
                <h2>Visit or write us</h2>
                <p>
                  Drop a note with what you need. When your LAN is live, this form can post to the
                  same host your team uses internally.
                </p>
              </header>
              <ul className="contact-aside">
                <li>
                  <span className="mono-label">Shop hours</span>
                  Mon–Sat · 9:00–18:00
                </li>
                <li>
                  <span className="mono-label">Service area</span>
                  Local delivery &amp; pickup — ask for coverage
                </li>
              </ul>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
