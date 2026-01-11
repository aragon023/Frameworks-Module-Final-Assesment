import { useMemo, useState } from "react";
import { useCalendarTasks } from "../../hooks/useCalendarTasks";
import TaskModal from "../TaskModal";
import type { Task } from "../../hooks/useTasks";

/* ------------------ date helpers ------------------ */

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
  const day = monthStart.getDay(); // Sunday start
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - day);
  return gridStart;
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(d.getDate() + days);
  return nd;
}

function eachDayBetween(startISO: string, endISO: string): string[] {
  const days: string[] = [];
  const current = new Date(startISO);
  const end = new Date(endISO);

  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/* ------------------ component ------------------ */

export default function MonthCalendar() {
  const isMobile = window.innerWidth < 768;

  const [cursor, setCursor] = useState(() => new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [prefillDueDate, setPrefillDueDate] = useState<string | null>(null);
  const todayKey = toISODate(new Date());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);



  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const gridStart = useMemo(() => startOfGrid(monthStart), [monthStart]);

  // 6-week grid (42 days)
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)),
    [gridStart]
  );

  // API range
  const rangeStart = useMemo(() => toISODate(monthStart), [monthStart]);
  const rangeEnd = useMemo(() => {
    const nextMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      1
    );
    return toISODate(nextMonth);
  }, [monthStart]);

  const {
    data: tasks = [],
    isLoading,
    error,
  } = useCalendarTasks(rangeStart, rangeEnd);

  /* -------- STEP 3.7: multi-day aware indexing -------- */

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();

    for (const t of tasks) {
      // Multi-day or scheduled task
      if (t.start_at && t.due_date) {
        const days = eachDayBetween(t.start_at, t.due_date);
        for (const day of days) {
          const arr = map.get(day) ?? [];
          arr.push(t);
          map.set(day, arr);
        }
        continue;
      }

      // Due-date-only task
      if (t.due_date) {
        const dayKey = t.due_date.slice(0, 10);
        const arr = map.get(dayKey) ?? [];
        arr.push(t);
        map.set(dayKey, arr);
      }
    }

    return map;
  }, [tasks]);

  const monthLabel = cursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function goToToday() {
  setCursor(new Date());
}


  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={prevMonth}>←</button>
        <button onClick={goToToday}>Today</button>
        <h2 style={{ margin: 0 }}>{monthLabel}</h2>
        <button onClick={nextMonth}>→</button>
        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
          Range: {rangeStart} → {rangeEnd}
        </div>
      </div>

      {isLoading && <div>Loading…</div>}
      {error instanceof Error && (
        <div style={{ color: "crimson" }}>{error.message}</div>
      )}

      {/* Calendar grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(7, 1fr)",
          gap: 8,
        }}
      >
       {!isMobile &&
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ fontWeight: 600, opacity: 0.8 }}>
            {d}
          </div>
        ))}


        {days.map((day) => {
          const dayKey = toISODate(day);
          const inMonth = day.getMonth() === monthStart.getMonth();
          const dayTasks = tasksByDay.get(dayKey) ?? [];
          const isToday = dayKey === todayKey;
          const isHovered = hoveredDay === dayKey;



          return (
              <div
                key={dayKey}
                onClick={() => {
                  setIsCreating(true);
                  setPrefillDueDate(dayKey);
                  setSelectedTask(null);
                }}
                onMouseEnter={() => setHoveredDay(dayKey)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: isMobile ? "row" : "column",
                  border: isToday
                    ? "2px solid #0d6efd"
                    : "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 8,
                  padding: isMobile ? 4 : 8,
                  minHeight: isMobile ? 70 : 110, 
                  transition: "background 0.15s ease",
                  background: isToday
                    ? "rgba(13,110,253,0.08)"
                    : isHovered
                    ? "rgba(0,0,0,0.05)"
                    : inMonth
                    ? "white"
                    : "rgba(0,0,0,0.04)",
                }}
              >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: isMobile ? 0 : 6,
                  minWidth: isMobile ? 40 : "auto",
                }}
              >

                <div style={{ fontWeight: 600 }}>{day.getDate()}</div>
                {dayTasks.length > 0 && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {dayTasks.length}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreating(false);
                      setPrefillDueDate(null);
                      setSelectedTask(t);
                    }}

                    style={{
                       textAlign: "left",
                       cursor: "pointer",
                       fontSize: 12,
                       padding: "4px 6px",
                       borderRadius: 6,
                       border: "1px solid rgba(0,0,0,0.10)",
                       borderLeft: t.start_at
                       ? "4px solid #0d6efd"     // scheduled
                       : "4px dashed rgba(0,0,0,0.4)", // due-only
                       background: t.completed
                       ? "rgba(0,0,0,0.08)"
                       : "rgba(0,0,0,0.03)",
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
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task modal */}
      <TaskModal
        show={isCreating || selectedTask !== null}
        onHide={() => {
          setIsCreating(false);
          setPrefillDueDate(null);
          setSelectedTask(null);
        }}
        initialTask={
          isCreating
            ? ({ due_date: prefillDueDate } as Task)
            : selectedTask
        }
      />
    </div>
  );
}
