import { useCart } from "../cart/CartContext.jsx";

export function CartDrawer({ open, onClose, onCheckout }) {
  const { lines, setQuantity, removeLine, totals } = useCart();

  if (!open) return null;

  return (
    <div className="cart-overlay" role="presentation" onMouseDown={onClose}>
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cart-drawer-head">
          <h2 id="cart-title">Your cart</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close cart">
            ×
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="cart-empty">Nothing here yet — add products or services from below.</p>
        ) : (
          <>
            <ul className="cart-lines">
              {lines.map((line) => (
                <li key={`${line.kind}:${line.catalogId}`} className="cart-line">
                  <div className="cart-line-main">
                    <span className="cart-line-kind">{line.kind === "product" ? "Product" : "Service"}</span>
                    <strong className="cart-line-name">{line.name}</strong>
                    <span className="cart-line-price">${line.unitPrice} each</span>
                  </div>
                  <div className="cart-line-actions">
                    <label className="qty">
                      <span className="sr-only">Quantity</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={line.quantity}
                        onChange={(e) =>
                          setQuantity(line.kind, line.catalogId, e.target.valueAsNumber || 1)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="btn-text"
                      onClick={() => removeLine(line.kind, line.catalogId)}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="cart-line-sub">
                    Line: ${(line.unitPrice * line.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="cart-totals">
              <div className="cart-total-row">
                <span>Subtotal</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-total-row">
                <span>Est. tax ({(totals.taxRate * 100).toFixed(0)}%)</span>
                <span>${totals.tax.toFixed(2)}</span>
              </div>
              <div className="cart-total-row cart-total-row--strong">
                <span>Total</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>
            </div>
            <button type="button" className="btn btn-primary cart-checkout-btn" onClick={onCheckout}>
              Proceed to checkout
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
