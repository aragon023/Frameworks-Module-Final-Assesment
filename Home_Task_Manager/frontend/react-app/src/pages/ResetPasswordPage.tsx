import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE as string;

type ResetParams = {
  uid?: string;
  token?: string;
};

const ResetPasswordPage: React.FC = () => {
  const { uid, token } = useParams<ResetParams>();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!uid || !token) {
      setStatus("error");
      setMessage("Invalid password reset link.");
    }
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uid || !token) return;

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setStatus(null);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/password-reset-confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
        }),
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
        setMessage(data.detail || "Password has been reset successfully.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setStatus("error");
        setMessage(data.detail || "Could not reset password.");
      }
    } catch (err) {
      console.error(err);
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
              <h1 className="h4 text-center mb-3">Set a new password</h1>
              <p className="text-muted small text-center mb-4">
                Choose a new password for your account. Make sure it&apos;s
                something secure that you haven&apos;t used before.
              </p>

              {status && (
                <div
                  className={`alert small ${
                    status === "success" ? "alert-success" : "alert-danger"
                  }`}
                >
                  {message}
                </div>
              )}

              {!uid || !token ? (
                <p className="text-danger small mb-0">
                  {message || "Invalid password reset link."}
                </p>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label htmlFor="new-password" className="form-label">
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="confirm-password"
                      className="form-label"
                    >
                      Confirm new password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100"
                  >
                    {loading ? "Updating..." : "Update password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
