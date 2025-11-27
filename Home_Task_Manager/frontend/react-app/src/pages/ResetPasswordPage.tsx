import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://localhost:8000/api";

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

      const data: { detail?: string } = await res.json();

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
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm bg-white">
      <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>

      {!uid || !token ? (
        <p className="text-sm text-red-600">
          {message || "Invalid reset link."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="new-password"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="confirm-password"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      )}

      {status && (
        <p
          className={`mt-4 text-sm ${
            status === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default ResetPasswordPage;
