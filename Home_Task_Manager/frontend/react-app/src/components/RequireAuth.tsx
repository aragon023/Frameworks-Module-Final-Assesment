import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";

export default function RequireAuth({ children }: { children: ReactElement }) {
  const token = localStorage.getItem("access");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
