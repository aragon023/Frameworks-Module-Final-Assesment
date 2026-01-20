import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "../api/auth";

const API_BASE = import.meta.env.VITE_API_BASE as string;

export type RewardsLeaderboardEntry = {
  id: number;
  name: string;
  points: number;
  role: string;
};

export type RewardsSummary = {
  my_points: number;
  household_total_points: number;
  leaderboard: RewardsLeaderboardEntry[];
};

export function useRewardsSummary() {
  return useQuery<RewardsSummary>({
    queryKey: ["rewardsSummary"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/rewards/summary/`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error("Failed to load rewards summary");
      return res.json();
    },
  });
}

export function useRedeemRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { points: number; note?: string }) => {
      const res = await fetch(`${API_BASE}/rewards/redeem/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body?.detail || "Failed to redeem rewards";
        throw new Error(message);
      }
      return res.json() as Promise<{ detail: string; new_balance: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewardsSummary"] });
    },
  });
}
