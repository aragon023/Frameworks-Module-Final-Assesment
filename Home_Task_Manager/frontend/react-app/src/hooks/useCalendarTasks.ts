import { useQuery } from "@tanstack/react-query";
import { fetchCalendarTasks } from "../api/calendar";

export function useCalendarTasks(start: string, end: string) {
  return useQuery({
    queryKey: ["calendarTasks", start, end],
    queryFn: () => fetchCalendarTasks(start, end),
    enabled: Boolean(start && end),
  });
}
