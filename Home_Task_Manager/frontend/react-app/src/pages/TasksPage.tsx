import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
  Badge,
} from "react-bootstrap";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  useTasks,
  useUpdateTask,
  useDeleteTask,
  type Task,
} from "../hooks/useTasks";
import { useMembers } from "../hooks/useMembers";
import TaskModal from "../components/TaskModal";
import { useCategories } from "../hooks/useCategories";


// ---- helpers ---------------------------------------------------------

function formatDueDate(due: string | null): string {
  if (!due) return "No due date";

  const date = new Date(due);
  const now = new Date();

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  if (sameDay(date, now)) {
    return `Today • ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  if (sameDay(date, tomorrow)) {
    return `Tomorrow • ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityBadge(priority: Task["priority"]) {
  switch (priority) {
    case "high":
      return <Badge bg="danger">High</Badge>;
    case "med":
      return <Badge bg="warning" text="dark">Medium</Badge>;
    case "low":
    default:
      return <Badge bg="success">Low</Badge>;
  }
}

// ---------------------------------------------------------------------

export default function TasksPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<"" | "low" | "med" | "high">("");
  const [completed, setCompleted] = useState("");
  const [assignee, setAssignee] = useState("");
  const [category, setCategory] = useState("");


  const members = useMembers(1);
  const tasks = useTasks({
    householdId: 1,
    search,
    completed: completed ? completed === "true" : undefined,
    priority: priority || undefined,
    category: category ? Number(category) : undefined,
    assignee_member: assignee ? Number(assignee) : undefined,
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Map members by id for quick lookup
  const memberById =
    members.data?.reduce<Record<number, string>>((acc, m) => {
      acc[m.id] = m.name;
      return acc;
    }, {}) ?? {};

  const categories = useCategories();
  const categoryById =
    categories.data?.reduce<Record<number, string>>((acc, c) => {
      acc[c.id] = c.name;
      return acc;
    }, {}) ?? {};  

  const openCreate = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleToggleCompleted = (task: Task) => {
    updateTask.mutate({ id: task.id, data: { completed: !task.completed } });
  };

  const handleDelete = (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    deleteTask.mutate(task.id);
  };

  const resetFilters = () => {
    setSearch("");
    setPriority("");
    setCompleted("");
    setAssignee("");
    setCategory("");
  };

  return (
    <DashboardLayout>
      <Container className="py-4">
        {/* Header */}
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-0">All Tasks</h2>
            <div className="text-muted">
              View and manage everything happening in your household.
            </div>
          </Col>
          <Col xs="auto">
            <Button variant="success" onClick={openCreate}>
              + Add Task
            </Button>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="gy-2 align-items-end">
              <Col md={3}>
                <Form.Label className="small text-muted">Search</Form.Label>
                <Form.Control
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Col>

              <Col md={2}>
                <Form.Label className="small text-muted">Priority</Form.Label>
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
                <Form.Label className="small text-muted">Status</Form.Label>
                <Form.Select
                  value={completed}
                  onChange={(e) => setCompleted(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="false">Active</option>
                  <option value="true">Completed</option>
                </Form.Select>
              </Col>

              <Col md={2}>
                <Form.Label className="small text-muted">Category</Form.Label>
                <Form.Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={categories.isLoading}
                >
                  <option value="">All categories</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={2}>
                <Form.Label className="small text-muted">Assignee</Form.Label>
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

              <Col md={1} className="text-md-end">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>


        {/* Task List */}
        {tasks.isLoading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" />
          </div>
        ) : tasks.data && tasks.data.length > 0 ? (
          tasks.data.map((task) => {
            const assigneeName = task.assignee_member
              ? memberById[task.assignee_member] ?? "Unknown"
              : "Unassigned";

            const categoryName = task.category
              ? categoryById[task.category] ?? "Uncategorised"
              : "Uncategorised";

            return (
              <Card key={task.id} className="mb-2 shadow-sm">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h5 className="mb-0">{task.title}</h5>
                        <div className="d-flex align-items-center gap-2">
                          {categoryName && categoryName !== "Uncategorised" && (
                            <Badge bg="secondary">{categoryName}</Badge>
                          )}
                          {priorityBadge(task.priority)}
                        </div>
                      </div>
                      <div className="small text-muted">
                        {formatDueDate(task.due_date)}
                      </div>
                      <div className="small text-muted">
                        Assigned to: {assigneeName}
                      </div>
                    </Col>
                    <Col xs="auto" className="d-flex gap-2">
                      <Button
                        variant={task.completed ? "outline-secondary" : "success"}
                        size="sm"
                        onClick={() => handleToggleCompleted(task)}
                      >
                        {task.completed ? "Mark as active" : "Mark as done"}
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEdit(task)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(task)}
                      >
                        Delete
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            );
          })
        ) : (
          <Card className="shadow-sm">
            <Card.Body className="text-center text-muted">
              <p className="mb-1">No tasks match your filters.</p>
              <p className="mb-0">Try clearing filters or create a new task.</p>
            </Card.Body>
          </Card>
        )}


        {/* Modal for create/edit */}
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
