import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "../api/auth";

const API_BASE = import.meta.env.VITE_API_BASE as string;

export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  auth_provider: "password" | "google";
  household?: { id: number; name: string };
};



export function useCurrentUser() {
  const queryClient = useQueryClient();

  // 🔹 GET /me/
  const userQuery = useQuery<CurrentUser>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/me/`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load user profile");
      }

      return res.json();
    },
  });

  // 🔹 PATCH /me/
  const updateUser = useMutation<
    CurrentUser,
    Error,
    Partial<Pick<CurrentUser, "username" | "email" | "first_name" | "last_name">>
  >({
    mutationFn: async (updates) => {
      const res = await fetch(`${API_BASE}/me/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to update profile");
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentUser"], data);
    },
  });

  // 🔹 POST /change-password/
  const changePassword = useMutation<
    { detail: string },
    Error,
    { old_password: string; new_password: string }
  >({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_BASE}/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.detail)
          ? data.detail.join(" ")
          : data.detail || "Failed to change password";
        throw new Error(msg);
      }

      return data;
    },
  });

  return {
    userQuery,
    updateUser,
    changePassword,
  };
}
