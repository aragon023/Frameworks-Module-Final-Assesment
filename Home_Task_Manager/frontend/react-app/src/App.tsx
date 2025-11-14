import { useState } from "react";
import { Container, Row, Col, Button, Card, Spinner } from "react-bootstrap";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "./layouts/DashboardLayout";
import TaskModal from "./components/TaskModal";
import { useUpdateTask, useDeleteTask } from "./hooks/useTasks";



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

const { data, isLoading, error } = useQuery<DashboardData>({
  queryKey: ["dashboard"],
  queryFn: async () => {
    const res = await fetch(`${API_BASE}/api/dashboard/?household=1`);
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


  console.log("App component rendered"); // Debugging log

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
        {/*existing JSX below stays the same */}
        <Row className="align-items-center mb-3">
          <Col>
            <h2 className="fw-bold">Welcome, Sarah!</h2>
            <p className="text-muted">
              {data?.stats.completed_this_week} tasks completed this week —{" "}
              {data?.stats.pending_rewards} reward points waiting.
            </p>
          </Col>
          <Col xs="auto">
            <Button variant="success" onClick={() => setShowTaskModal(true)}>
              + Add New Task
            </Button>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <h5 className="fw-bold mb-3">Overdue Tasks</h5>
            {data?.overdue.length ? (
              data.overdue.map((task) => (
                <Card key={task.id} className="mb-2 shadow-sm">
                  <Card.Body>
                    <Card.Title className="d-flex justify-content-between align-items-center">
                      <span>{task.title}</span>
                      <small className="text-uppercase text-danger fw-semibold">
                        {task.priority}
                      </small>
                    </Card.Title>
                    <Card.Text className="text-danger mb-2">
                      Due date: {task.due_date ? new Date(task.due_date).toLocaleString() : "N/A"}
                    </Card.Text>
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
              ))
            ) : (
              <p className="text-muted">No overdue tasks 🎉</p>
            )}
          </Col>

          <Col md={6}>
            <h5 className="fw-bold mb-3">Upcoming Tasks</h5>
            {data?.upcoming.length ? (
              data.upcoming.map((task) => (
                <Card key={task.id} className="mb-2 shadow-sm">
                  <Card.Body>
                    <Card.Title className="d-flex justify-content-between align-items-center">
                      <span>{task.title}</span>
                      <small className="text-uppercase text-success fw-semibold">
                        {task.priority}
                      </small>
                    </Card.Title>
                    <Card.Text className="text-success mb-2">
                      Due: {task.due_date ? new Date(task.due_date).toLocaleString() : "N/A"}
                    </Card.Text>
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
              ))
            ) : (
              <p className="text-muted">No upcoming tasks</p>
            )}
          </Col>
        </Row>
      </Container>

    <TaskModal
        show={showTaskModal}
        onHide={() => setShowTaskModal(false)}
        householdId={1}
        initialTask={null}
      />

    </DashboardLayout>
  );
}