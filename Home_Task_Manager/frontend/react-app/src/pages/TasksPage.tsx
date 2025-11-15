import { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Spinner } from "react-bootstrap";
import { useTasks } from "../hooks/useTasks";
import { useMembers } from "../hooks/useMembers";
import TaskModal from "../components/TaskModal";
import type { Task } from "../hooks/useTasks";
import DashboardLayout from "../layouts/DashboardLayout";

export default function TasksPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<"" | "low" | "med" | "high">("");
  const [completed, setCompleted] = useState("");
  const [assignee, setAssignee] = useState("");

  const members = useMembers(1);
  const tasks = useTasks({
    householdId: 1,
    search,
    completed: completed ? completed === "true" : undefined,
    priority: priority || undefined,
    assignee_member: assignee ? Number(assignee) : undefined,
  });

  const openCreate = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h2 className="fw-bold">All Tasks</h2>
          </Col>
          <Col xs="auto">
            <Button variant="success" onClick={openCreate}>
              + Add Task
            </Button>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4 p-3 shadow-sm">
          <Row className="gy-2">
            <Col md={3}>
              <Form.Control
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>

            <Col md={2}>
              <Form.Select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "" | "low" | "med" | "high")
                }
              >
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Select
                value={completed}
                onChange={(e) => setCompleted(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="false">Active</option>
                <option value="true">Completed</option>
              </Form.Select>
            </Col>

            <Col md={3}>
              <Form.Select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                disabled={members.isLoading}
              >
                <option value="">All assignees</option>
                {members.data?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card>

        {/* Task List */}
        {tasks.isLoading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" />
          </div>
        ) : tasks.data && tasks.data.length > 0 ? (
          tasks.data.map((task) => (
            <Card key={task.id} className="mb-2 shadow-sm">
              <Card.Body>
                <Row className="align-items-center">
                  <Col>
                    <h5 className="mb-1">{task.title}</h5>
                    <div className="small text-muted">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleString()
                        : "No due date"}
                    </div>
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => openEdit(task)}
                    >
                      Edit
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))
        ) : (
          <p className="text-muted">No tasks found.</p>
        )}

        {/* Modal */}
        <TaskModal
          show={showModal}
          onHide={() => setShowModal(false)}
          initialTask={editingTask}
          householdId={1}
        />
      </Container>
    </DashboardLayout>
  );
}
