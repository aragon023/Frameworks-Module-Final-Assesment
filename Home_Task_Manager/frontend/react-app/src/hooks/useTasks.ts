import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "../api/auth";

const API_BASE = import.meta.env.VITE_API_BASE as string;

export type Task = {
  id: number;
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

export type TaskPayload = {
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
  search?: string;
  category?: number;
  assignee_member?: number;
  assignee_pet?: number;
  completed?: boolean;
  priority?: "low" | "med" | "high";
};

function buildQuery(filters: TaskFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category != null) params.set("category", String(filters.category));
  if (filters.assignee_member != null)
    params.set("assignee_member", String(filters.assignee_member));
  if (filters.assignee_pet != null)
    params.set("assignee_pet", String(filters.assignee_pet));
  if (filters.completed != null)
    params.set("completed", filters.completed ? "true" : "false");
  if (filters.priority) params.set("priority", filters.priority);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// READ
export function useTasks(filters: TaskFilters = {}) {
  return useQuery<Task[]>({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const query = buildQuery(filters);
      const res = await fetch(`${API_BASE}/tasks/${query}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
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

      const res = await fetch(`${API_BASE}/tasks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create task");
      return res.json() as Promise<Task>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendarTasks"] });
    },
  });
}

// UPDATE
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TaskPayload> }) => {
      const res = await fetch(`${API_BASE}/tasks/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json() as Promise<Task>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendarTasks"] });
    },
  });
}

// DELETE
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_BASE}/tasks/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
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
