import { Container, Row, Col, Button, Card, Spinner } from "react-bootstrap";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "./layouts/DashboardLayout";

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
 
const API_BASE = import.meta.env.VITE_API_BASE as string;

const { data, isLoading, error } = useQuery<DashboardData>({
  queryKey: ["dashboard"],
  queryFn: async () => {
    const res = await fetch(`${API_BASE}/api/dashboard/?household=1`);
    if (!res.ok) throw new Error("Network response was not ok");
    return res.json();
  },
});


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
            <Button variant="success">+ Add New Task</Button>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <h5 className="fw-bold mb-3">Overdue Tasks</h5>
            {data?.overdue.length ? (
              data.overdue.map((task) => (
                <Card key={task.id} className="mb-2 shadow-sm">
                  <Card.Body>
                    <Card.Title>{task.title}</Card.Title>
                    <Card.Text className="text-danger">
                      Due date: {task.due_date ? new Date(task.due_date).toLocaleString() : "N/A"}
                    </Card.Text>
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
                    <Card.Title>{task.title}</Card.Title>
                    <Card.Text className="text-success">
                      Due: {task.due_date ? new Date(task.due_date).toLocaleString() : "N/A"}
                    </Card.Text>
                  </Card.Body>
                </Card>
              ))
            ) : (
              <p className="text-muted">No upcoming tasks</p>
            )}
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}