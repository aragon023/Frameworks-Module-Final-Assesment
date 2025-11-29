import { Offcanvas, Nav, Button, ListGroup, Spinner } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useMembers } from "../hooks/useMembers";

type SidebarProps = {
  show: boolean;
  onHide: () => void;
  householdId?: number;
};

export default function Sidebar({ show, onHide, householdId = 1 }: SidebarProps) {
  const { data, isLoading, error } = useMembers(householdId);

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      scroll
      backdrop
      className="bg-light"
      style={{ width: 280 }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="fw-bold">HomeTasker</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <div className="mb-4">
          <div className="text-muted small">Household</div>
          <div className="fw-semibold">Aragon Family</div>
        </div>

        <Nav className="flex-column gap-2 mb-4">
          <Nav.Link
            as={NavLink}
            to="/"
            className="btn btn-light text-start"
          >
            🏠 Dashboard
          </Nav.Link>

          <Nav.Link
            as={NavLink}
            to="/tasks"
            className="btn btn-light text-start"
          >
            📋 Tasks
          </Nav.Link>

          <Nav.Link
            as={NavLink}
            to="/categories"
            className="btn btn-light text-start"
          >
            📂 Categories
          </Nav.Link>

          <Nav.Link
            as={NavLink}
            to="/members"
            className="btn btn-light text-start"
          >
            👨‍👩‍👧 Family
          </Nav.Link>

          <Nav.Link
            as={NavLink}
            to="/pets"
            className="btn btn-light text-start"
          >
            🐾 Pets
          </Nav.Link>

          {/* Future features (not wired yet) */}
          <Nav.Link className="btn btn-light text-start">
            📅 Calendar
          </Nav.Link>

          {/* Future features (not wired yet) */}
          <Nav.Link className="btn btn-light text-start">
            ⭐ Rewards
          </Nav.Link>

          {/* New: Profile page */}
          <Nav.Link
            as={NavLink}
            to="/profile"
            className="btn btn-light text-start"
          >
            👤 Profile
          </Nav.Link>

          {/* Future features (not available yet) */}
          <Nav.Link className="btn btn-light text-start">
            ⚙️ Settings
          </Nav.Link>
        </Nav>

        <div className="text-muted small mb-2">Family</div>

        {isLoading ? (
          <div className="py-3 text-center">
            <Spinner animation="border" size="sm" />
          </div>
        ) : error ? (
          <div className="text-danger small mb-3">
            Failed to load members.
          </div>
        ) : (
          <ListGroup variant="flush" className="mb-4">
            {(data ?? []).map((m) => (
              <ListGroup.Item
                key={m.id}
                className="d-flex align-items-center gap-2"
              >
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt={m.name}
                    style={{ width: 32, height: 32, borderRadius: "50%" }}
                  />
                ) : (
                  <span
                    className="rounded-circle bg-secondary-subtle d-inline-flex justify-content-center align-items-center"
                    style={{ width: 32, height: 32 }}
                  >
                    {m.name?.[0] ?? "•"}
                  </span>
                )}
                {m.name}
              </ListGroup.Item>
            ))}
            {(!data || data.length === 0) && (
              <ListGroup.Item className="text-muted">
                No members yet
              </ListGroup.Item>
            )}
          </ListGroup>
        )}

        <Button variant="success" className="w-100">
          Invite Member
        </Button>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
