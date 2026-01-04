import { getAuthHeaders } from "./auth";
import type { Task } from "../hooks/useTasks";

export async function fetchCalendarTasks(start: string, end: string): Promise<Task[]> {
  const res = await fetch(
    `http://127.0.0.1:8000/api/calendar/tasks/?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar tasks request failed (${res.status}): ${text}`);
  }

  return res.json();
}
