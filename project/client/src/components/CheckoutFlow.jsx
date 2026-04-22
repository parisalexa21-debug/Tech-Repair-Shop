import { useEffect, useRef, useState } from "react";
import { useCart } from "../cart/CartContext.jsx";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const initialShipping = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
};

export function CheckoutFlow({ open, onClose }) {
  const { lines, totals, clearCart } = useCart();
  const [step, setStep] = useState("shipping");
  const prevOpen = useRef(false);
  const [shipping, setShipping] = useState(initialShipping);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setStep("shipping");
      setError("");
      setPlacedOrder(null);
      setSubmitting(false);
    }
    prevOpen.current = open;
  }, [open]);

  function resetAndClose() {
    setStep("shipping");
    setShipping(initialShipping);
    setPaymentMethod("card");
    setCardNumber("");
    setError("");
    setPlacedOrder(null);
    onClose();
  }

  function handleShippingNext(e) {
    e.preventDefault();
    setError("");
    if (!shipping.fullName.trim() || !shipping.email.includes("@") || !shipping.addressLine1.trim()) {
      setError("Please complete name, email, and street address.");
      return;
    }
    if (!shipping.city.trim() || !shipping.state.trim() || !shipping.postalCode.trim()) {
      setError("City, state, and postal code are required.");
      return;
    }
    setStep("payment");
  }

  async function placeOrder(e) {
    e.preventDefault();
    setError("");
    if (lines.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    const digits = cardNumber.replace(/\D/g, "");
    if (paymentMethod === "card" && digits.length < 4) {
      setError("Enter at least the last 4 digits of your card (demo checkout).");
      return;
    }

    const items = lines.map((l) => ({
      kind: l.kind,
      catalogId: l.catalogId,
      quantity: l.quantity,
    }));

    const payload = {
      items,
      shipping,
      payment:
        paymentMethod === "pickup"
          ? { method: "pickup" }
          : { method: "card", cardLast4: digits.slice(-4) },
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Order failed (${res.status})`);
      setPlacedOrder(data.order);
      clearCart();
      setStep("success");
    } catch (err) {
      setError(err.message || "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="checkout-overlay" role="presentation" onMouseDown={resetAndClose}>
      <div
        className="checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="checkout-head">
          <h2 id="checkout-title">
            {step === "success" ? "Order confirmed" : "Checkout"}
          </h2>
          <button type="button" className="icon-btn" onClick={resetAndClose} aria-label="Close checkout">
            ×
          </button>
        </div>

        {step === "shipping" && (
          <form className="checkout-form" onSubmit={handleShippingNext}>
            <p className="checkout-step-label">Step 1 of 2 — Shipping</p>
            <div className="checkout-grid">
              <label className="field field--full">
                <span>Full name</span>
                <input
                  required
                  value={shipping.fullName}
                  onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                  autoComplete="shipping name"
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={shipping.email}
                  onChange={(e) => setShipping((s) => ({ ...s, email: e.target.value }))}
                  autoComplete="email"
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  type="tel"
                  value={shipping.phone}
                  onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                  autoComplete="tel"
                />
              </label>
              <label className="field field--full">
                <span>Street address</span>
                <input
                  required
                  value={shipping.addressLine1}
                  onChange={(e) => setShipping((s) => ({ ...s, addressLine1: e.target.value }))}
                  autoComplete="shipping address-line1"
                />
              </label>
              <label className="field field--full">
                <span>Apt / suite (optional)</span>
                <input
                  value={shipping.addressLine2}
                  onChange={(e) => setShipping((s) => ({ ...s, addressLine2: e.target.value }))}
                  autoComplete="shipping address-line2"
                />
              </label>
              <label className="field">
                <span>City</span>
                <input
                  required
                  value={shipping.city}
                  onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  autoComplete="address-level2"
                />
              </label>
              <label className="field">
                <span>State / region</span>
                <input
                  required
                  value={shipping.state}
                  onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value }))}
                  autoComplete="address-level1"
                />
              </label>
              <label className="field">
                <span>Postal code</span>
                <input
                  required
                  value={shipping.postalCode}
                  onChange={(e) => setShipping((s) => ({ ...s, postalCode: e.target.value }))}
                  autoComplete="postal-code"
                />
              </label>
              <label className="field">
                <span>Country</span>
                <input
                  value={shipping.country}
                  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                  autoComplete="country"
                />
              </label>
            </div>
            {error ? (
              <p className="form-status form-status--err" role="alert">
                {error}
              </p>
            ) : null}
            <div className="checkout-actions">
              <button type="button" className="btn btn-ghost" onClick={resetAndClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Continue to payment
              </button>
            </div>
          </form>
        )}

        {step === "payment" && (
          <form className="checkout-form" onSubmit={placeOrder}>
            <p className="checkout-step-label">Step 2 of 2 — Payment</p>

            <div className="checkout-summary">
              <h3 className="checkout-summary-title">Order summary</h3>
              <ul className="checkout-summary-lines">
                {lines.map((l) => (
                  <li key={`${l.kind}:${l.catalogId}`}>
                    <span>
                      {l.name} × {l.quantity}
                    </span>
                    <span>${(l.unitPrice * l.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="checkout-summary-totals">
                <div>
                  <span>Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span>Est. tax</span>
                  <span>${totals.tax.toFixed(2)}</span>
                </div>
                <div className="checkout-summary-total">
                  <span>Total</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <fieldset className="payment-fieldset">
              <legend className="mono-label">Payment method</legend>
              <label className="radio-row">
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <span>Card (demo — use test digits)</span>
              </label>
              <label className="radio-row">
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "pickup"}
                  onChange={() => setPaymentMethod("pickup")}
                />
                <span>Pay in store at pickup</span>
              </label>
            </fieldset>

            {paymentMethod === "card" ? (
              <label className="field field--full">
                <span>Card number (demo — e.g. 4242 4242 4242 4242)</span>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="•••• •••• •••• ••••"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </label>
            ) : (
              <p className="checkout-hint">You&apos;ll complete payment when you collect your order.</p>
            )}

            {error ? (
              <p className="form-status form-status--err" role="alert">
                {error}
              </p>
            ) : null}

            <div className="checkout-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep("shipping")} disabled={submitting}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Placing order…" : "Place order"}
              </button>
            </div>
          </form>
        )}

        {step === "success" && placedOrder && (
          <div className="checkout-success">
            <p className="checkout-success-id">
              Order <strong>{placedOrder.id}</strong>
            </p>
            <p className="checkout-success-total">
              Total charged: <strong>${Number(placedOrder.total).toFixed(2)}</strong>
            </p>
            <p className="checkout-success-copy">
              A confirmation has been recorded for <strong>{placedOrder.shipping.email}</strong>. This is a demo
              checkout — connect a payment gateway and email service for production.
            </p>
            <button type="button" className="btn btn-primary" onClick={resetAndClose}>
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
