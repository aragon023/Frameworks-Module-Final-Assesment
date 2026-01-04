import { useMemo, useState } from "react";
import { useCalendarTasks } from "../../hooks/useCalendarTasks";
import TaskModal from "../TaskModal";
import type { Task } from "../../hooks/useTasks";

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfGrid(monthStart: Date) {
  // Sunday-start grid
  const day = monthStart.getDay();
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - day);
  return gridStart;
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(d.getDate() + days);
  return nd;
}

export default function MonthCalendar() {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const gridStart = useMemo(() => startOfGrid(monthStart), [monthStart]);

  // Render 6 weeks (42 days)
  const days = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [gridStart]);

  // API range: [monthStart, first day of next month)
  const rangeStart = useMemo(() => toISODate(monthStart), [monthStart]);
  const rangeEnd = useMemo(() => {
    const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    return toISODate(nextMonth);
  }, [monthStart]);

  const { data: tasks = [], isLoading, error } = useCalendarTasks(rangeStart, rangeEnd);

  // Index tasks by day based on due_date (YYYY-MM-DD)
  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      const dayKey = t.due_date.slice(0, 10);
      const arr = map.get(dayKey) ?? [];
      arr.push(t);
      map.set(dayKey, arr);
    }
    // Sort by due_date time within each day
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
      map.set(k, arr);
    }
    return map;
  }, [tasks]);

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  function prevMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={prevMonth}>←</button>
        <h2 style={{ margin: 0 }}>{monthLabel}</h2>
        <button onClick={nextMonth}>→</button>
        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75 }}>
          Range: {rangeStart} → {rangeEnd}
        </div>
      </div>

      {isLoading && <div>Loading…</div>}
      {error instanceof Error && <div style={{ color: "crimson" }}>{error.message}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 8,
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ fontWeight: 600, opacity: 0.8 }}>
            {d}
          </div>
        ))}

        {days.map((day) => {
          const dayKey = toISODate(day);
          const inMonth = day.getMonth() === monthStart.getMonth();
          const dayTasks = tasksByDay.get(dayKey) ?? [];

          return (
            <div
              key={dayKey}
              style={{
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 8,
                padding: 8,
                minHeight: 110,
                background: inMonth ? "white" : "rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{day.getDate()}</div>
                {dayTasks.length > 0 && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{dayTasks.length}</div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTask(t)}
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "4px 6px",
                      borderRadius: 6,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: t.completed ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.02)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={t.title}
                  >
                    {t.title}
                  </button>
                ))}

                {dayTasks.length > 3 && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit task modal */}
      <TaskModal
        show={selectedTask !== null}
        onHide={() => setSelectedTask(null)}
        initialTask={selectedTask}
      />
    </div>
  );
}
