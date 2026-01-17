import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Accepting invite...");

  const navigate = useNavigate();

  useEffect(() => {
    async function accept() {
      if (!token) {
        setStatus("error");
        setMessage("Missing invite token.");
        return;
      }

      const access = localStorage.getItem("access");
      if (!access) {
        // not logged in → send to login + come back here after
        navigate(`/login?next=/invite/accept?token=${token}`);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/household/invites/accept/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data?.detail || "Failed to accept invite.");
          return;
        }

        setStatus("success");
        setMessage("Invite accepted! Redirecting...");

        setTimeout(() => navigate("/"), 800);
      } catch {
        setStatus("error");
        setMessage("Network error accepting invite.");
      }
    }

    accept();
  }, [token, navigate]);

  return (
    <div className="container py-5" style={{ maxWidth: 600 }}>
      <h2 className="mb-3">Household Invite</h2>

      {status === "loading" && <div className="alert alert-info">{message}</div>}
      {status === "success" && <div className="alert alert-success">{message}</div>}
      {status === "error" && <div className="alert alert-danger">{message}</div>}
    </div>
  );
}
