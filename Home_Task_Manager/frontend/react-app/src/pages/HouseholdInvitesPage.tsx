import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export default function HouseholdInvitesPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"adult" | "child" | "admin">("adult");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const access = localStorage.getItem("access");
      const res = await fetch(`${API_BASE}/household/invites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.detail || "Failed to send invite.");
        return;
      }

      setMessage(`Invite created ✅ Link: ${data.invite_link}`);
      setEmail("");
      setRole("adult");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 520 }}>
      <h2 className="mb-3">Invite Household Member</h2>
      <p className="text-muted mb-4">
        Send an invite link by email. Only admins can invite members.
      </p>

      <form onSubmit={sendInvite} className="card p-3">
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            className="form-control"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Role</label>
          <select
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="adult">Adult</option>
            <option value="child">Child</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {message && <div className="alert alert-success py-2">{message}</div>}
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <button className="btn btn-primary w-100" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Invite"}
        </button>
      </form>
    </div>
  );
}
