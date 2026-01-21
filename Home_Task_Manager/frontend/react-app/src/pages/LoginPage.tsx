import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError("Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      setLoading(false);
      navigate(nextUrl);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError("Google login failed. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      setLoading(false);
      navigate(nextUrl);
    } catch (err) {
      console.error(err);
      setError("Google login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <Row className="w-100" style={{ maxWidth: 420 }}>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <h3 className="fw-bold mb-3 text-center">Sign in</h3>
              <p className="text-muted text-center mb-4">
                Log in to manage your household tasks.
              </p>

              {error && (
                <Alert variant="danger" className="py-2">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="loginUsername">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="loginPassword">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="success"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </Form>

              {/* Divider */}
              <div className="text-center my-3 text-muted">or</div>

              {/* Google button */}
              <div className="d-flex justify-content-center">
                <GoogleLogin
                  onSuccess={(credResp) => {
                    if (credResp.credential) {
                      handleGoogleLogin(credResp.credential);
                    } else {
                      setError("Google login failed: missing credential.");
                    }
                  }}
                  onError={() => setError("Google login failed. Please try again.")}
                />
              </div>

              <div className="text-center mt-3 small">
                Don&apos;t have an account? <Link to="/register">Create one</Link>
              </div>

              <div className="text-end mt-2">
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                  Forgot your password?
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
