import { useEffect, useState } from "react";
import { Container, Card, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getAuthHeaders } from "../api/auth";
import DashboardLayout from "../layouts/DashboardLayout";


const API_BASE = import.meta.env.VITE_API_BASE as string;

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    // no token in URL
    if (!token) {
      setStatus("error");
      setMessage("Missing invite token.");
      return;
    }
  }, [token]);

  async function acceptInvite() {
    if (!token) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/household/invites/accept/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.detail || "Failed to accept invite.");
        return;
      }

      setStatus("success");
      setMessage("Invite accepted! Redirecting to dashboard…");

      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Card className="shadow-sm" style={{ maxWidth: 520 }}>
          <Card.Body>
            <h4 className="fw-bold mb-2">Accept household invite</h4>
            <p className="text-muted mb-3">
              You’re about to join a household. Click below to accept.
            </p>

            {status === "error" && <Alert variant="danger">{message}</Alert>}
            {status === "success" && <Alert variant="success">{message}</Alert>}

            <div className="d-grid gap-2">
              <Button
                variant="success"
                onClick={acceptInvite}
                disabled={!token || status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Spinner size="sm" className="me-2" /> Accepting…
                  </>
                ) : (
                  "Accept invite"
                )}
              </Button>

              <Link to="/" className="btn btn-outline-secondary">
                Back to dashboard
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </DashboardLayout>
  );
}
