import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bench-byte-cart-v1";

function lineKey(kind, catalogId) {
  return `${kind}:${catalogId}`;
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l) =>
        l &&
        (l.kind === "product" || l.kind === "service") &&
        typeof l.catalogId === "string" &&
        typeof l.name === "string" &&
        typeof l.unitPrice === "number" &&
        typeof l.quantity === "number",
    );
  } catch {
    return [];
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() => loadStored());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addToCart = useCallback((kind, item) => {
    const key = lineKey(kind, item.id);
    setLines((prev) => {
      const idx = prev.findIndex((l) => lineKey(l.kind, l.catalogId) === key);
      const unitPrice = item.priceFrom;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          kind,
          catalogId: item.id,
          name: item.name,
          unitPrice,
          quantity: 1,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((kind, catalogId, quantity) => {
    const q = Math.max(0, Math.min(99, Math.floor(Number(quantity))));
    setLines((prev) => {
      const key = lineKey(kind, catalogId);
      const idx = prev.findIndex((l) => lineKey(l.kind, l.catalogId) === key);
      if (idx < 0) return prev;
      if (q === 0) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: q };
      return next;
    });
  }, []);

  const removeLine = useCallback((kind, catalogId) => {
    const key = lineKey(kind, catalogId);
    setLines((prev) => prev.filter((l) => lineKey(l.kind, l.catalogId) !== key));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const taxRate = 0.08;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { subtotal, taxRate, tax, total };
  }, [lines]);

  const itemCount = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({
      lines,
      addToCart,
      setQuantity,
      removeLine,
      clearCart,
      totals,
      itemCount,
    }),
    [lines, addToCart, setQuantity, removeLine, clearCart, totals, itemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
