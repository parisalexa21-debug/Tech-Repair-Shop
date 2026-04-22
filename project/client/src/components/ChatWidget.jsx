import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const starter = {
  role: "assistant",
  text: "Hi! I can help with products, services, store hours, and checkout.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([starter]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Chat request failed.");
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply || "No reply available." }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: err.message || "Something went wrong while contacting chat." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-widget">
      <button
        type="button"
        className="chat-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chat-panel"
      >
        {open ? "Close chat" : "Chat with us"}
      </button>

      {open ? (
        <section className="chat-panel" id="chat-panel" aria-label="Support chat">
          <header className="chat-head">
            <strong>Bench &amp; Byte Assistant</strong>
            <span>Store hours: Mon-Sat 9:00-18:00</span>
          </header>
          <div className="chat-messages" role="log" aria-live="polite">
            {messages.map((m, idx) => (
              <p key={`${m.role}-${idx}`} className={`chat-msg chat-msg--${m.role}`}>
                {m.text}
              </p>
            ))}
          </div>
          <form className="chat-input-row" onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about repairs, products, or checkout..."
              maxLength={1200}
            />
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
