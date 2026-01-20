import { useState } from "react";
import { Container, Row, Col, Button, Card, Spinner, Badge } from "react-bootstrap";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "./layouts/DashboardLayout";
import TaskModal from "./components/TaskModal";
import { useUpdateTask, useDeleteTask } from "./hooks/useTasks";
import { useCurrentUser } from "./hooks/useCurrentUser";

interface Task {
  id: number;
  title: string;
  due_date: string | null;
  priority: string;
  completed: boolean;
  assignee?: {
    id: number;
    name: string;
    avatar_url?: string;
    icon?: string;
    type: string;
  } | null;
}

interface DashboardData {
  stats: {
    completed_this_week: number;
    pending_rewards: number;
  };
  overdue: Task[];
  upcoming: Task[];
}

export default function App() {
  const [showTaskModal, setShowTaskModal] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE as string;

  const { userQuery } = useCurrentUser();
  const user = userQuery.data;

  const rawName =
    (user?.first_name && user.first_name.trim()) ||
    (user?.username && user.username.trim()) ||
    "";

  const displayName =
    rawName.length > 0
      ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
      : "there";

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/dashboard/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });

      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleToggleCompleted = (id: number, currentCompleted: boolean) => {
    updateTask.mutate({ id, data: { completed: !currentCompleted } });
  };

  const handleDeleteTask = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    deleteTask.mutate(id);
  };

  const priorityVariant = (priority: string) => {
    if (priority === "high") return { bg: "danger" };
    if (priority === "med") return { bg: "warning", text: "dark" as const };
    return { bg: "success" };
  };

  if (isLoading)
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <Spinner animation="border" />
      </div>
    );

  if (error)
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center text-danger">
        <p>Failed to load data.</p>
      </div>
    );

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-1">Welcome back, {displayName}</h2>
            <div className="text-muted">
              Keep the household moving with clear priorities and quick wins.
            </div>
          </Col>
          <Col xs="auto" />
        </Row>

        <Row className="g-3 mb-4">
          <Col md={6} lg={4}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body>
                <div className="text-muted text-uppercase small">Completed this week</div>
                <div className="display-6 fw-bold">
                  {data?.stats.completed_this_week ?? 0}
                </div>
                <div className="text-muted small">Nice momentum.</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={4}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body>
                <div className="text-muted text-uppercase small">Reward points</div>
                <div className="display-6 fw-bold">
                  {data?.stats.pending_rewards ?? 0}
                </div>
                <div className="text-muted small">Ready to redeem.</div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4}>
            <Card className="shadow-sm border-0 h-100 bg-light">
              <Card.Body className="d-flex flex-column justify-content-between">
                <div>
                  <div className="fw-semibold">Quick actions</div>
                  <div className="text-muted small">Create tasks and stay on track.</div>
                </div>
                <div className="d-grid mt-3">
                  <Button variant="success" onClick={() => setShowTaskModal(true)}>
                    + Add New Task
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3">
          <Col lg={6}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white fw-semibold">Overdue Tasks</Card.Header>
              <Card.Body>
                {data?.overdue.length ? (
                  data.overdue.map((task) => {
                    const badgeProps = priorityVariant(task.priority);
                    return (
                      <Card key={task.id} className="mb-3 border-0 bg-light">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="fw-semibold">{task.title}</div>
                            <Badge bg={badgeProps.bg} text={badgeProps.text}>
                              {task.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-danger small mb-3">
                            Due: {task.due_date ? new Date(task.due_date).toLocaleString() : "N/A"}
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant={task.completed ? "outline-secondary" : "success"}
                              onClick={() => handleToggleCompleted(task.id, task.completed)}
                            >
                              {task.completed ? "Mark as not done" : "Mark as done"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-muted">No overdue tasks.</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white fw-semibold">Upcoming Tasks</Card.Header>
              <Card.Body>
                {data?.upcoming.length ? (
                  data.upcoming.map((task) => {
                    const badgeProps = priorityVariant(task.priority);
                    return (
                      <Card key={task.id} className="mb-3 border-0 bg-light">
                        <Card.Body className="p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="fw-semibold">{task.title}</div>
                            <Badge bg={badgeProps.bg} text={badgeProps.text}>
                              {task.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-success small mb-3">
                            Due: {task.due_date ? new Date(task.due_date).toLocaleString() : "N/A"}
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant={task.completed ? "outline-secondary" : "success"}
                              onClick={() => handleToggleCompleted(task.id, task.completed)}
                            >
                              {task.completed ? "Mark as not done" : "Mark as done"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-muted">No upcoming tasks.</div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <TaskModal
        show={showTaskModal}
        onHide={() => setShowTaskModal(false)}
        initialTask={null}
      />
    </DashboardLayout>
  );
}
