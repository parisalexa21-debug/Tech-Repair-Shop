import { useEffect, useState } from "react";

const STORAGE_KEY = "bench-byte-helpdesk-tickets";
const API_BASE = import.meta.env.VITE_API_URL ?? "";

function loadTicketsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTicketsToStorage(tickets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  deviceType: "",
  description: "",
};

export function HelpDesk() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTickets(loadTicketsFromStorage());
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSuccess(null);
    setError("");

    if (!form.fullName.trim() || !form.email.trim() || !form.deviceType || !form.description.trim()) {
      setError("Please complete full name, email, device type, and description.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/helpdesk/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          deviceType: form.deviceType,
          description: form.description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit ticket.");
      const ticket = data.ticket;
      const next = [ticket, ...tickets];
      setTickets(next);
      saveTicketsToStorage(next);
      setForm({ ...emptyForm });
      setSuccess({ ticketId: ticket.ticketId, message: `Ticket ${ticket.ticketId} was submitted successfully.` });
    } catch (err) {
      setError(err.message || "Unable to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  function categoryLabel(value) {
    const map = {
      repair: "Repair",
      "tech-support": "Tech support",
      "delivery-problem": "Delivery problem",
      billing: "Billing",
      other: "Other",
    };
    return map[value] ?? value;
  }

  return (
    <section className="section section--helpdesk" id="helpdesk">
      <div className="container">
        <header className="section-head">
          <h2>Help desk</h2>
          <p>Open a support ticket. Your requests are saved in this browser until you clear site data.</p>
        </header>

        {success ? (
          <div className="helpdesk-success banner" role="status">
            <p>
              <strong>{success.message}</strong> We&apos;ll follow up using the email you provided.
            </p>
          </div>
        ) : null}

        <form className="helpdesk-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              name="fullName"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Phone number</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Device type</span>
            <select
              name="deviceType"
              required
              value={form.deviceType}
              onChange={(e) => updateField("deviceType", e.target.value)}
            >
              <option value="">Select device type</option>
              <option value="Phone">Phone</option>
              <option value="Laptop">Laptop</option>
              <option value="Tablet">Tablet</option>
              <option value="Desktop">Desktop</option>
              <option value="Other device">Other</option>
            </select>
          </label>
          <label className="field field--full">
            <span>Description</span>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="What happened, when it started, and any steps you already tried…"
            />
          </label>
          {error ? (
            <p className="form-status form-status--err" role="alert">
              {error}
            </p>
          ) : null}
          <div className="helpdesk-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit ticket"}
            </button>
          </div>
        </form>

        <div className="helpdesk-table-wrap">
          <h3 className="helpdesk-table-title">Submitted tickets</h3>
          {tickets.length === 0 ? (
            <p className="helpdesk-empty">No tickets yet. Submit the form above to create one.</p>
          ) : (
            <div className="helpdesk-scroll">
              <table className="helpdesk-table">
                <thead>
                  <tr>
                    <th scope="col">Ticket ID</th>
                    <th scope="col">Date submitted</th>
                    <th scope="col">Customer name</th>
                    <th scope="col">Device type</th>
                    <th scope="col">Category</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action taken</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.ticketId}>
                      <td>
                        <code className="helpdesk-ticket-id">{t.ticketId}</code>
                      </td>
                      <td>{formatDate(t.dateSubmitted)}</td>
                      <td>{t.customerName}</td>
                      <td>{t.deviceType}</td>
                      <td>{categoryLabel(t.category)}</td>
                      <td className={`helpdesk-priority helpdesk-priority--${t.priority}`}>{t.priority}</td>
                      <td>{t.status}</td>
                      <td>{t.actionTaken || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
