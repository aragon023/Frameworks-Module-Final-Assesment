import { useQuery } from "@tanstack/react-query";

export type Member = { id: number; name: string; avatar_url?: string | null };

export function useMembers(householdId: number = 1) {
  const API_BASE = import.meta.env.VITE_API_BASE as string;
  return useQuery<Member[]>({
    queryKey: ["members", householdId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/members/?household=${householdId}`);
      if (!res.ok) throw new Error("Failed to load members");
      return res.json();
    },
  });
}
