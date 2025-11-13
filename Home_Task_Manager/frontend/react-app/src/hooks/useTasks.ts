import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE as string;

// Shape of a Task as returned by the API
export type Task = {
  id: number;
  household: number;
  title: string;
  description: string;
  category: number | null;
  assignee_member: number | null;
  assignee_pet: number | null;
  due_date: string | null;
  priority: "low" | "med" | "high";
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Payload for creating/updating a task
export type TaskPayload = {
  household: number;
  title: string;
  description?: string;
  category?: number | null;
  assignee_member?: number | null;
  assignee_pet?: number | null;
  due_date?: string | null;
  priority?: "low" | "med" | "high";
  completed?: boolean;
};

type TaskFilters = {
  householdId?: number;
  search?: string;
  category?: number;
  assignee_member?: number;
  assignee_pet?: number;
  completed?: boolean;
};

// Helper: build query string from filters
function buildQuery(filters: TaskFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.householdId != null) params.set("household", String(filters.householdId));
  if (filters.search) params.set("search", filters.search);
  if (filters.category != null) params.set("category", String(filters.category));
  if (filters.assignee_member != null) params.set("assignee_member", String(filters.assignee_member));
  if (filters.assignee_pet != null) params.set("assignee_pet", String(filters.assignee_pet));
  if (filters.completed != null) params.set("completed", filters.completed ? "true" : "false");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// READ: list tasks with optional filters
export function useTasks(filters: TaskFilters = { householdId: 1 }) {
  const { householdId = 1, ...rest } = filters;

  return useQuery<Task[]>({
    queryKey: ["tasks", { householdId, ...rest }],
    queryFn: async () => {
      const query = buildQuery({ householdId, ...rest });
      const res = await fetch(`${API_BASE}/api/tasks/${query}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      return res.json();
    },
  });
}

// CREATE
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TaskPayload) => {
      const res = await fetch(`${API_BASE}/api/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json() as Promise<Task>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// UPDATE (partial)
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TaskPayload> }) => {
      const res = await fetch(`${API_BASE}/api/tasks/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json() as Promise<Task>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// DELETE
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/api/tasks/${id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
