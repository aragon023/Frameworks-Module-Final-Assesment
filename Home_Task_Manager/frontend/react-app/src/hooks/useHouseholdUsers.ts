import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "../api/auth";

const API_BASE = import.meta.env.VITE_API_BASE as string;

export function useUpdateHouseholdUserRole() {
  const queryClient = useQueryClient();

  return useMutation<
    { detail: string; role: string },
    Error,
    { user_id: number; role: "admin" | "adult" | "child" }
  >({
    mutationFn: async ({ user_id, role }) => {
      const res = await fetch(`${API_BASE}/household/users/${user_id}/role/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to update role");
      }

      return data;
    },
    onSuccess: () => {
      // refresh members list after role update
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
