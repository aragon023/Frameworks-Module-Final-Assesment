import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE as string;

export type Member = {
  id: number;
  name: string;
  avatar_url?: string | null;
};

// READ: list members for a household (used by sidebar, filters, etc.)
export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/members/`);
      if (!res.ok) throw new Error("Failed to load members");
      return res.json();
    },
  });
}


// CREATE (for Members management page)
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { name: string; avatar_url?: string | null }) => {
      const res = await fetch(`${API_BASE}/member-items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create member");
      return res.json() as Promise<Member>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

// UPDATE
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Member> }) => {
      const res = await fetch(`${API_BASE}/member-items/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update member");
      return res.json() as Promise<Member>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

// DELETE
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/member-items/${id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete member");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
