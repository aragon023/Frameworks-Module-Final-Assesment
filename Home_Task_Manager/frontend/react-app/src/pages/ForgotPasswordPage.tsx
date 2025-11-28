
import React, { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE as string;

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      let data: { detail?: string } = {};

      try {
        data = await res.json();
      } catch {
        const text = await res.text();
        data = { detail: text };
      }

      if (res.ok) {
        setStatus("success");
        setMessage(
          data.detail || "If this email exists, a reset link will be sent."
        );
      } else {
        setStatus("error");
        setMessage(
          data.detail || "Something went wrong. Please try again."
        );
      }
    } catch (err) {
      console.error("Network-level error:", err);
      setStatus("error");
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h4 text-center mb-3">Forgot your password?</h1>
              <p className="text-muted small text-center mb-4">
                Enter the email associated with your account and,
                if it exists, we&apos;ll send you a link to reset your password.
              </p>

              {status && (
                <div
                  className={`alert ${
                    status === "success"
                      ? "alert-success"
                      : "alert-danger"
                  } small`}
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <div className="text-center mt-3">
                <Link to="/login" className="small">
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>

          {/* Optional: small app name/footer under the card */}
          {/* <p className="text-center text-muted small mt-3">
            Home Task Manager
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
