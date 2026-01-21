import { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  usePets,
  useCreatePet,
  useUpdatePet,
  useDeletePet,
  type Pet,
} from "../hooks/usePets";

export default function PetsPage() {
  const { data, isLoading, error } = usePets();
  const createPet = useCreatePet();
  const updatePet = useUpdatePet();
  const deletePet = useDeletePet();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIcon, setEditingIcon] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    createPet.mutate(
      { name, icon: newIcon.trim() || null },
      {
        onSuccess: () => {
          setNewName("");
          setNewIcon("");
        },
      }
    );
  };

  const startEdit = (pet: Pet) => {
    setEditingId(pet.id);
    setEditingName(pet.name);
    setEditingIcon(pet.icon ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingIcon("");
  };

  const saveEdit = () => {
    if (editingId == null) return;
    const name = editingName.trim();
    const icon = editingIcon.trim();
    if (!name) return;

    updatePet.mutate(
      { id: editingId, data: { name, icon: icon || null } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingName("");
          setEditingIcon("");
        },
      }
    );
  };

  const handleDelete = (pet: Pet) => {
    if (!window.confirm(`Remove pet "${pet.name}"?`)) return;
    deletePet.mutate(pet.id);
  };

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-0">Pets</h2>
            <div className="text-muted">
              Add the pets in your household so you can link tasks to them.
            </div>
          </Col>
        </Row>

        <Row>
          {/* Add new pet */}
          <Col md={5} className="mb-3">
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fs-5 mb-3">Add Pet</Card.Title>
                <Form onSubmit={handleCreate}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Luna, Max..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">
                      Icon or emoji (optional)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 🐶 or 🐱"
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="success"
                    disabled={createPet.isPending}
                  >
                    {createPet.isPending ? "Adding..." : "Add pet"}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Existing pets */}
          <Col md={7} className="mb-3">
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fs-5 mb-3">Household Pets</Card.Title>

                {isLoading ? (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : error ? (
                  <div className="text-danger">
                    Failed to load pets. Please try again.
                  </div>
                ) : data && data.length > 0 ? (
                  <ListGroup variant="flush">
                    {data.map((p) => (
                      <ListGroup.Item
                        key={p.id}
                        className="d-flex align-items-center justify-content-between gap-2"
                      >
                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                          <span style={{ fontSize: 24 }}>
                            {p.icon || "🐾"}
                          </span>
                          <div className="flex-grow-1">
                            {editingId === p.id ? (
                              <>
                                <Form.Control
                                  value={editingName}
                                  onChange={(e) =>
                                    setEditingName(e.target.value)
                                  }
                                  size="sm"
                                  className="mb-1"
                                />
                                <Form.Control
                                  value={editingIcon}
                                  onChange={(e) =>
                                    setEditingIcon(e.target.value)
                                  }
                                  size="sm"
                                  placeholder="Emoji or small icon"
                                />
                              </>
                            ) : (
                              <>
                                <div>{p.name}</div>
                                {p.icon && (
                                  <div className="small text-muted">
                                    Icon set
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          {editingId === p.id ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={saveEdit}
                                disabled={updatePet.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => startEdit(p)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(p)}
                                disabled={deletePet.isPending}
                              >
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <div className="text-muted">
                    No pets yet. Add your first pet on the left.
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}
