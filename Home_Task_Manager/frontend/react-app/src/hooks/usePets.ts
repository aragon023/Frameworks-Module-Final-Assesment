import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "../api/auth";

const API_BASE = import.meta.env.VITE_API_BASE as string;

export type Pet = {
  id: number;
  name: string;
  icon?: string | null;
};

// READ
export function usePets() {
  return useQuery<Pet[]>({
    queryKey: ["pets"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/pets/`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error("Failed to load pets");
      return res.json();
    },
  });
}

// CREATE
export function useCreatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; icon?: string | null }) => {
      const res = await fetch(`${API_BASE}/pets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create pet");
      return res.json() as Promise<Pet>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });
}

// UPDATE
export function useUpdatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Pet> }) => {
      const res = await fetch(`${API_BASE}/pets/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update pet");
      return res.json() as Promise<Pet>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });
}

// DELETE
export function useDeletePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/pets/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete pet");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });
}
