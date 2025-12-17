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
  useMembers,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
} from "../hooks/useMembers";
import type { Member } from "../hooks/useMembers";

export default function MembersPage() {
  const { data, isLoading, error } = useMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingAvatar, setEditingAvatar] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    createMember.mutate(
      { name, avatar_url: newAvatar.trim() || null },
      {
        onSuccess: () => {
          setNewName("");
          setNewAvatar("");
        },
      }
    );
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditingName(member.name);
    setEditingAvatar(member.avatar_url ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingAvatar("");
  };

  const saveEdit = () => {
    if (editingId == null) return;
    const name = editingName.trim();
    const avatar = editingAvatar.trim();
    if (!name) return;

    updateMember.mutate(
      { id: editingId, data: { name, avatar_url: avatar || null } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingName("");
          setEditingAvatar("");
        },
      }
    );
  };

  const handleDelete = (member: Member) => {
    if (!window.confirm(`Remove "${member.name}" from this household?`)) return;
    deleteMember.mutate(member.id);
  };

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-0">Family Members</h2>
            <div className="text-muted">
              Manage who is part of this household and how they appear in the app.
            </div>
          </Col>
        </Row>

        <Row>
          {/* Add new member */}
          <Col md={5} className="mb-3">
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fs-5 mb-3">Add Member</Card.Title>
                <Form onSubmit={handleCreate}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Nicola, Mauricio..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">
                      Avatar URL (optional)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Link to profile picture"
                      value={newAvatar}
                      onChange={(e) => setNewAvatar(e.target.value)}
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="success"
                    disabled={createMember.isPending}
                  >
                    {createMember.isPending ? "Adding..." : "Add member"}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Existing members */}
          <Col md={7} className="mb-3">
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fs-5 mb-3">Household Members</Card.Title>

                {isLoading ? (
                  <div className="d-flex justify-content-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : error ? (
                  <div className="text-danger">
                    Failed to load members. Please try again.
                  </div>
                ) : data && data.length > 0 ? (
                  <ListGroup variant="flush">
                    {data.map((m) => (
                      <ListGroup.Item
                        key={m.id}
                        className="d-flex align-items-center justify-content-between gap-2"
                      >
                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                          {m.avatar_url ? (
                            <img
                              src={m.avatar_url}
                              alt={m.name}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span
                              className="rounded-circle bg-secondary-subtle d-inline-flex justify-content-center align-items-center"
                              style={{ width: 32, height: 32 }}
                            >
                              {m.name?.[0] ?? "•"}
                            </span>
                          )}

                          <div className="flex-grow-1">
                            {editingId === m.id ? (
                              <>
                                <Form.Control
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  size="sm"
                                  className="mb-1"
                                />
                                <Form.Control
                                  value={editingAvatar}
                                  onChange={(e) =>
                                    setEditingAvatar(e.target.value)
                                  }
                                  size="sm"
                                  placeholder="Avatar URL"
                                />
                              </>
                            ) : (
                              <>
                                <div>{m.name}</div>
                                {m.avatar_url && (
                                  <div className="small text-muted">
                                    Avatar set
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          {editingId === m.id ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={saveEdit}
                                disabled={updateMember.isPending}
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
                                onClick={() => startEdit(m)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(m)}
                                disabled={deleteMember.isPending}
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
                    No members yet. Add your first family member on the left.
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
