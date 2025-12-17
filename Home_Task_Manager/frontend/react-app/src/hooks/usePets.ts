import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE as string;

export type Pet = {
  id: number;
  name: string;
  icon?: string | null; // e.g. 🐶 or 🐱
};

// READ
export function usePets() {
  return useQuery<Pet[]>({
    queryKey: ["pets"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/pets/`);
      if (!res.ok) throw new Error("Failed to load pets");
      return res.json();
    },
  });
}

// CREATE
export function useCreatePet() {
  const queryClient = useQueryClient();

  return useMutation<Pet, Error, { name: string; icon?: string | null }>({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_BASE}/pets/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // optional: log extra info to debug 500s from the backend
        const errorText = await res.text();
        console.error("Create pet failed:", res.status, errorText);
        throw new Error("Failed to create pet");
      }

      return (await res.json()) as Pet;
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
        headers: { "Content-Type": "application/json" },
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
      });
      if (!res.ok) throw new Error("Failed to delete pet");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });
}
