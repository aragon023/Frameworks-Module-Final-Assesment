import { useState, type ReactNode } from "react";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useMembers } from "../hooks/useMembers";
import { useCurrentUser } from "../hooks/useCurrentUser";

type Props = { children: ReactNode };

export default function DashboardLayout({ children }: Props) {
  const [showSidebar, setShowSidebar] = useState(false);
  const { data: members, isLoading, error } = useMembers();
  const navigate = useNavigate();

  const { userQuery } = useCurrentUser();
  const householdName = userQuery.data?.household?.name || "Household";
  const roleLabel = userQuery.data?.role || "";



  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `btn btn-light text-start ${isActive ? "fw-bold border" : ""}`;

  return (
    <div className="min-vh-100 bg-light">
      {/* Mobile top bar */}
      <div className="d-md-none d-flex justify-content-between align-items-center p-3 bg-white border-bottom">
        <Button variant="outline-secondary" onClick={() => setShowSidebar(true)}>
          ☰
        </Button>
        <div className="fw-bold">HomeTasker</div>
        <div style={{ width: 36 }} />
      </div>

      <Container fluid>
        <Row>
          {/* Desktop sidebar */}
          <Col
            md={3}
            lg={2}
            className="d-none d-md-block border-end bg-white min-vh-100 p-3"
          >
            <div className="fw-bold fs-5 mb-1">HomeTasker</div>
            <div className="text-muted small mb-3">{householdName}</div>
            {roleLabel && (
              <div className="text-muted small mb-3">
                Role: <span className="fw-semibold text-uppercase">{roleLabel}</span>
              </div>
            )}


            <div className="d-grid gap-2 mb-3">
              <NavLink to="/" end className={navLinkClass}>
                🏠 Dashboard
              </NavLink>

              <NavLink to="/tasks" className={navLinkClass}>
                📋 Tasks
              </NavLink>

              <NavLink to="/categories" className={navLinkClass}>
                🗂️ Categories
              </NavLink>

              <NavLink to="/calendar" className={navLinkClass}>
                📅 Calendar
              </NavLink>

              <NavLink to="/rewards" className={navLinkClass}>
                🏆 Rewards
              </NavLink>

              <NavLink to="/members" className={navLinkClass}>
                👨‍👩‍👧 Family
              </NavLink>

              <NavLink to="/household/invites" className={navLinkClass}>
                ✉️ Invite Members
              </NavLink>


              <NavLink to="/pets" className={navLinkClass}>
                🐾 Pets
              </NavLink>

              <NavLink to="/profile" className={navLinkClass}>
                👤 Profile
              </NavLink>
            </div>

            <div className="text-muted small mb-2">Family members</div>

            {isLoading ? (
              <div className="py-2 text-center">
                <Spinner animation="border" size="sm" />
              </div>
            ) : error ? (
              <div className="text-danger small mb-2">Failed to load members.</div>
            ) : (
              <div className="d-grid gap-2">
                {(members ?? []).map((m) => (
                  <div key={m.id} className="d-flex align-items-center gap-2">
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
                  </div>
                ))}
                {(!members || members.length === 0) && (
                  <div className="text-muted">No members yet</div>
                )}
              </div>
            )}
          </Col>

          {/* Main content */}
          <Col xs={12} md={9} lg={10} className="p-3">
            <div className="d-flex justify-content-end mb-3">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </div>
            {children}
          </Col>
        </Row>
      </Container>

      {/* Mobile sidebar */}
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />
    </div>
  );
}
