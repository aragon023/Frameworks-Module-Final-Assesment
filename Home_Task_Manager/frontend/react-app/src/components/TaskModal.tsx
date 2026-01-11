import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useMembers } from "../hooks/useMembers";
import { useCreateTask, useUpdateTask } from "../hooks/useTasks";
import type { Task, TaskPayload } from "../hooks/useTasks";
import { useCategories } from "../hooks/useCategories";
import { usePets } from "../hooks/usePets";

type TaskModalProps = {
  show: boolean;
  onHide: () => void;
  initialTask?: Task | null;
};

function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function TaskModal({
  show,
  onHide,
  initialTask = null,
}: TaskModalProps) {
  const isEdit = !!initialTask?.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("low");
  const [dueDate, setDueDate] = useState<string>("");
  const [assigneeMemberId, setAssigneeMemberId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [petId, setPetId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [startAt, setStartAt] = useState<string>("");


  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: pets, isLoading: petsLoading } = usePets();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  // Reset form whenever modal opens or task changes
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || "");
      setPriority(initialTask.priority);

      setStartAt(toDateTimeLocal(initialTask.start_at));
      setDueDate(toDateTimeLocal(initialTask.due_date));
      
      setAssigneeMemberId(
        initialTask.assignee_member ? String(initialTask.assignee_member) : ""
      );
      setCategoryId(
        initialTask.category ? String(initialTask.category) : ""
      );
      setPetId(
        initialTask.assignee_pet ? String(initialTask.assignee_pet) : ""
      );
    } else {
      setTitle("");
      setDescription("");
      setPriority("low");
      setStartAt("");
      setDueDate("");
      setAssigneeMemberId("");
      setCategoryId("");
      setPetId("");
    }
    setFormError(null);
  }, [initialTask, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }

    const payload: TaskPayload = {
      title: title.trim(),
      description: description.trim() || "",
      priority,
      start_at: startAt ? new Date(startAt).toISOString() : null, 
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      assignee_member: assigneeMemberId ? Number(assigneeMemberId) : null,
      assignee_pet: petId ? Number(petId) : null,
      category: categoryId ? Number(categoryId) : null,
    };


    try {
      if (isEdit && initialTask?.id) {
        await updateTask.mutateAsync({
          id: initialTask.id,
          data: payload,
        });
      } else {
        await createTask.mutateAsync(payload);
      }
      onHide();
    } catch {
      setFormError("Something went wrong saving the task. Please try again.");
    }
  };

  const isSaving = createTask.isPending || updateTask.isPending;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? "Edit Task" : "Add New Task"}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vacuum living room"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Start date & time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Due date & time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as "low" | "med" | "high")
                  }
                >
                  <option value="low">Low</option>
                  <option value="med">Medium</option>
                  <option value="high">High</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            {categoriesLoading ? (
              <Spinner size="sm" />
            ) : (
              <Form.Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No category</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Related pet</Form.Label>
            {petsLoading ? (
              <Spinner size="sm" />
            ) : (
              <Form.Select
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
              >
                <option value="">No related pet</option>
                {(pets ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon ? `${p.icon} ${p.name}` : p.name}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Assign to</Form.Label>
            {membersLoading ? (
              <Spinner size="sm" />
            ) : (
              <Form.Select
                value={assigneeMemberId}
                onChange={(e) => setAssigneeMemberId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {(members ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={isSaving}>
            {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create task"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
