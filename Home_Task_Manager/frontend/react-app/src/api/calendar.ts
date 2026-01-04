import { getAuthHeaders } from "./auth"; 

export type Task = {
  id: number;
  title: string;
  description?: string;
  start_at: string | null;
  due_date: string | null;
  priority: "low" | "med" | "high";
  completed: boolean;

  assignee_member: number | null;
  assignee_pet: number | null;

  // optional google fields (read-only)
  google_event_id?: string | null;
  google_calendar_id?: string | null;
};

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
