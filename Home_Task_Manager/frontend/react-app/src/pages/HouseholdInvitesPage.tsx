import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import DashboardLayout from "../layouts/DashboardLayout";
import { getAuthHeaders } from "../api/auth";

const API_BASE = import.meta.env.VITE_API_BASE as string;

export default function HouseholdInvitesPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"adult" | "child" | "admin">("adult");
  const [loading, setLoading] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    setInviteLink(null);

    try {
      const res = await fetch(`${API_BASE}/household/invites/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.detail || "Failed to send invite.");
        return;
      }

      setSuccessMsg("Invite created successfully!");
      setInviteLink(data.invite_link || null);
      setEmail("");
      setRole("adult");
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyInviteLink() {
  if (!inviteLink) return;
  await navigator.clipboard.writeText(inviteLink);
  setSuccessMsg("Invite link copied ✅");
}

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-0">Invite Members</h2>
            <div className="text-muted">
              Only admins can invite new household members.
            </div>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fs-5 mb-3">Send Invite</Card.Title>

                {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
                {successMsg && <Alert variant="success">{successMsg}</Alert>}

                <Form onSubmit={sendInvite}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">Role</Form.Label>
                    <Form.Select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      disabled={loading}
                    >
                      <option value="adult">Adult</option>
                      <option value="child">Child</option>
                      <option value="admin">Admin</option>
                    </Form.Select>
                  </Form.Group>

                  <Button type="submit" variant="success" className="w-100" disabled={loading}>
                    {loading ? "Sending..." : "Send Invite"}
                  </Button>
                </Form>

                {inviteLink && (
                    <div className="mt-3">
                        <div className="small text-muted mb-1">Invite link:</div>

                        <div className="d-flex gap-2">
                        <Form.Control value={inviteLink} readOnly />
                        <Button variant="outline-primary" onClick={copyInviteLink}>
                            Copy
                        </Button>
                        </div>
                    </div>
                    )}

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}
