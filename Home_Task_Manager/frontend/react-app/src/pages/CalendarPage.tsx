import { useMemo } from "react";
import { Container, Row, Col, Card, Badge, ListGroup, Spinner } from "react-bootstrap";
import DashboardLayout from "../layouts/DashboardLayout";
import MonthCalendar from "../components/Calendar/MonthCalendar";
import { useCalendarTasks } from "../hooks/useCalendarTasks";
import type { Task } from "../hooks/useTasks";

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(d.getDate() + days);
  return nd;
}

function getTaskDate(task: Task): Date | null {
  const raw = task.start_at ?? task.due_date ?? null;
  return raw ? new Date(raw) : null;
}

export default function CalendarPage() {
  const today = new Date();
  const rangeStart = toISODate(today);
  const rangeEnd = toISODate(addDays(today, 30));

  const {
    data: upcomingTasks = [],
    isLoading: isUpcomingLoading,
    error: upcomingError,
  } = useCalendarTasks(rangeStart, rangeEnd);

  const upcoming = useMemo(() => {
    return upcomingTasks
      .filter((task) => !task.completed)
      .slice()
      .sort((a, b) => {
        const aDate = getTaskDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bDate = getTaskDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      })
      .slice(0, 6);
  }, [upcomingTasks]);

  const priorityBadge = (priority: Task["priority"]) => {
    if (priority === "high") return <Badge bg="danger">High</Badge>;
    if (priority === "med") return <Badge bg="warning" text="dark">Medium</Badge>;
    return <Badge bg="success">Low</Badge>;
  };

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-0">Calendar</h2>
            <div className="text-muted">
              View and schedule tasks across your month.
            </div>
          </Col>
        </Row>

        <Row className="g-3">
          <Col lg={9}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center border-0 border-start border-4 border-secondary">
                <div className="fw-semibold">Monthly overview</div>
                <Badge bg="secondary" className="text-uppercase">
                  Month view
                </Badge>
              </Card.Header>
              <Card.Body>
                <MonthCalendar />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white fw-semibold border-0 border-start border-4 border-secondary">
                Upcoming Tasks
              </Card.Header>
              <Card.Body className="p-0">
                {isUpcomingLoading ? (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : upcomingError ? (
                  <div className="text-danger small px-3 py-4">
                    Failed to load upcoming tasks.
                  </div>
                ) : upcoming.length > 0 ? (
                  <ListGroup variant="flush" className="border-0">
                    {upcoming.map((task) => {
                      const date = getTaskDate(task);
                      return (
                        <ListGroup.Item key={task.id} className="d-flex justify-content-between align-items-start gap-2 border-0">
                          <div>
                            <div className="fw-semibold">{task.title}</div>
                            <div className="text-muted small">
                              {date ? date.toLocaleString() : "No date"}
                            </div>
                          </div>
                          {priorityBadge(task.priority)}
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                ) : (
                  <div className="text-muted small px-3 py-4">No upcoming tasks.</div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}
