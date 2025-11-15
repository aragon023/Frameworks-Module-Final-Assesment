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
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/useCategories";
import type { Category } from "../hooks/useCategories";

export default function CategoriesPage() {
  const { data, isLoading, error } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    createCategory.mutate(name, {
      onSuccess: () => setNewName(""),
    });
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = () => {
    if (editingId == null) return;
    const name = editingName.trim();
    if (!name) return;
    updateCategory.mutate(
      { id: editingId, name },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingName("");
        },
      }
    );
  };

  const handleDelete = (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    deleteCategory.mutate(cat.id);
  };

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-0">Categories</h2>
            <div className="text-muted">
              Organise your tasks by simple, reusable categories.
            </div>
          </Col>
        </Row>

        <Row>
          {/* Add new category */}
          <Col md={5} className="mb-3">
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fs-5 mb-3">Add Category</Card.Title>
                <Form onSubmit={handleCreate}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">
                      Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Cleaning, Groceries..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="success"
                    disabled={createCategory.isPending}
                  >
                    {createCategory.isPending ? "Adding..." : "Add category"}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Existing categories */}
          <Col md={7} className="mb-3">
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fs-5 mb-3">Existing Categories</Card.Title>

                {isLoading ? (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : error ? (
                  <div className="text-danger">
                    Failed to load categories. Please try again.
                  </div>
                ) : data && data.length > 0 ? (
                  <ListGroup variant="flush">
                    {data.map((cat) => (
                      <ListGroup.Item
                        key={cat.id}
                        className="d-flex align-items-center justify-content-between gap-2"
                      >
                        <div className="flex-grow-1">
                          {editingId === cat.id ? (
                            <Form.Control
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              size="sm"
                            />
                          ) : (
                            <span>{cat.name}</span>
                          )}
                        </div>
                        <div className="d-flex gap-2">
                          {editingId === cat.id ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={saveEdit}
                                disabled={updateCategory.isPending}
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
                                onClick={() => startEdit(cat)}
                              >
                                Rename
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(cat)}
                                disabled={deleteCategory.isPending}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <div className="text-muted">
                    No categories yet. Add your first one on the left.
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
